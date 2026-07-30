#ifndef VI_STATE_SHARED_HPP_
#define VI_STATE_SHARED_HPP_

#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

namespace vi_state_shared {

struct State {
	uint32_t dev_fps;
	uint32_t fps;
	uint32_t width_gt;
	uint32_t width_ls;
	uint32_t height_gt;
	uint32_t height_ls;
};

enum Field : uint32_t {
	FIELD_NONE = 0U,
	FIELD_DEV_FPS = 1U << 0,
	FIELD_FPS = 1U << 1,
	FIELD_ERROR_COUNTER = 1U << 2,
};

enum ProcReadStatus {
	PROC_READ_OK,
	PROC_READ_OPEN_FAILED,
	PROC_READ_NO_KNOWN_FIELDS,
};

enum ReadStatus {
	READ_OK,
	READ_UNAVAILABLE,
	READ_INVALID,
	READ_BUSY,
	READ_STALE,
};

inline uint32_t monotonic_ms()
{
	struct timespec now;
	clock_gettime(CLOCK_MONOTONIC, &now);
	return (uint32_t)((uint64_t)now.tv_sec * 1000 + now.tv_nsec / 1000000);
}

inline const char *shared_path()
{
	return "/dev/shm/nanokvm_vi_state";
}

inline uint32_t parse(FILE *fp, State *state)
{
	if (fp == NULL || state == NULL) {
		return FIELD_NONE;
	}

	*state = State();
	uint32_t fields = FIELD_NONE;
	char line[256];
	char field[32];
	unsigned int value;
	while (fgets(line, sizeof(line), fp) != NULL) {
		if (sscanf(line, " %31[^ :\t] %*[: \t] %u", field, &value) != 2) {
			continue;
		}
		if (strcmp(field, "VIDevFPS") == 0) {
			state->dev_fps = value;
			fields |= FIELD_DEV_FPS;
		} else if (strcmp(field, "VIFPS") == 0) {
			state->fps = value;
			fields |= FIELD_FPS;
		} else if (strcmp(field, "VICsiCh0WidthGTCnt") == 0) {
			state->width_gt = value;
			fields |= FIELD_ERROR_COUNTER;
		} else if (strcmp(field, "VICsiCh0WidthLSCnt") == 0) {
			state->width_ls = value;
			fields |= FIELD_ERROR_COUNTER;
		} else if (strcmp(field, "VICsiCh0HeightGTCnt") == 0) {
			state->height_gt = value;
			fields |= FIELD_ERROR_COUNTER;
		} else if (strcmp(field, "VICsiCh0HeightLSCnt") == 0) {
			state->height_ls = value;
			fields |= FIELD_ERROR_COUNTER;
		}
	}
	return fields;
}

inline ProcReadStatus read_proc_state(State *state, uint32_t *fields)
{
	if (fields != NULL) {
		*fields = FIELD_NONE;
	}
	if (state == NULL) {
		return PROC_READ_NO_KNOWN_FIELDS;
	}

	FILE *fp = fopen("/proc/cvitek/vi_dbg", "r");
	if (fp == NULL) {
		return PROC_READ_OPEN_FAILED;
	}

	uint32_t parsed_fields = parse(fp, state);
	fclose(fp);
	if (fields != NULL) {
		*fields = parsed_fields;
	}
	return parsed_fields == FIELD_NONE ? PROC_READ_NO_KNOWN_FIELDS : PROC_READ_OK;
}

inline uint8_t classify(const State &state)
{
	if (state.dev_fps == 0) return 2;
	if (state.fps != 0) return 1;
	if (state.width_gt != 0) return 3;
	if (state.width_ls != 0) return 4;
	if (state.height_gt != 0) return 5;
	if (state.height_ls != 0) return 6;
	return 7;
}

inline const char *read_status_name(ReadStatus status)
{
	switch (status) {
	case READ_OK:
		return "ok";
	case READ_UNAVAILABLE:
		return "unavailable";
	case READ_INVALID:
		return "invalid";
	case READ_BUSY:
		return "busy";
	case READ_STALE:
		return "stale";
	}
	return "unknown";
}

namespace detail {

enum : uint32_t {
	SHARED_MAGIC = 0x4e4b5649U,
	SHARED_VERSION = 1U,
};

struct SharedState {
	uint32_t sequence;
	uint32_t magic;
	uint32_t version;
	uint32_t updated_ms;
	State state;
};

} // namespace detail

inline ReadStatus read_state(State *state, uint32_t max_age_ms)
{
	if (state == NULL) {
		return READ_INVALID;
	}

	int fd = open(shared_path(), O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
	if (fd < 0) {
		return READ_UNAVAILABLE;
	}

	struct stat stat_buf;
	if (fstat(fd, &stat_buf) != 0 || !S_ISREG(stat_buf.st_mode) ||
		stat_buf.st_size < (off_t)sizeof(detail::SharedState)) {
		close(fd);
		return READ_INVALID;
	}

	void *addr = mmap(NULL, sizeof(detail::SharedState), PROT_READ, MAP_SHARED, fd, 0);
	close(fd);
	if (addr == MAP_FAILED) {
		return READ_UNAVAILABLE;
	}

	const detail::SharedState *shared = (const detail::SharedState *)addr;
	ReadStatus result = READ_BUSY;
	for (int attempt = 0; attempt < 3; attempt++) {
		uint32_t sequence = __atomic_load_n(&shared->sequence, __ATOMIC_ACQUIRE);
		if (sequence & 1U) {
			continue;
		}

		uint32_t magic = __atomic_load_n(&shared->magic, __ATOMIC_RELAXED);
		uint32_t version = __atomic_load_n(&shared->version, __ATOMIC_RELAXED);
		uint32_t updated_ms = __atomic_load_n(&shared->updated_ms, __ATOMIC_RELAXED);
		State value = {};
		value.dev_fps = __atomic_load_n(&shared->state.dev_fps, __ATOMIC_RELAXED);
		value.fps = __atomic_load_n(&shared->state.fps, __ATOMIC_RELAXED);
		value.width_gt = __atomic_load_n(&shared->state.width_gt, __ATOMIC_RELAXED);
		value.width_ls = __atomic_load_n(&shared->state.width_ls, __ATOMIC_RELAXED);
		value.height_gt = __atomic_load_n(&shared->state.height_gt, __ATOMIC_RELAXED);
		value.height_ls = __atomic_load_n(&shared->state.height_ls, __ATOMIC_RELAXED);
		__atomic_thread_fence(__ATOMIC_ACQUIRE);
		uint32_t final_sequence = __atomic_load_n(&shared->sequence, __ATOMIC_RELAXED);
		if (sequence != final_sequence || (final_sequence & 1U)) {
			continue;
		}
		if (magic != detail::SHARED_MAGIC || version != detail::SHARED_VERSION) {
			result = READ_INVALID;
			break;
		}
		if (monotonic_ms() - updated_ms > max_age_ms) {
			result = READ_STALE;
			break;
		}
		*state = value;
		result = READ_OK;
		break;
	}

	munmap(addr, sizeof(detail::SharedState));
	return result;
}

} // namespace vi_state_shared

#endif // VI_STATE_SHARED_HPP_
