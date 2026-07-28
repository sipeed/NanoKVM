#ifndef VI_STATE_SHARED_HPP_
#define VI_STATE_SHARED_HPP_

#include <fcntl.h>
#include <stdint.h>
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

uint8_t refresh();

namespace detail {

static const char path[] = "/dev/shm/nanokvm_vi_state";
static const uint32_t magic = 0x4e4b5649U;
static const uint32_t version = 1U;

struct SharedState {
	uint32_t sequence;
	uint32_t magic;
	uint32_t version;
	uint32_t updated_ms;
	State state;
};

inline uint32_t monotonic_ms()
{
	struct timespec now;
	clock_gettime(CLOCK_MONOTONIC, &now);
	return (uint32_t)((uint64_t)now.tv_sec * 1000 + now.tv_nsec / 1000000);
}

inline const SharedState *map_reader()
{
	static const SharedState *shared = NULL;
	if (shared != NULL) {
		return shared;
	}

	int fd = open(path, O_RDONLY | O_CLOEXEC);
	if (fd < 0) {
		return NULL;
	}
	struct stat stat_buf;
	if (fstat(fd, &stat_buf) != 0 || stat_buf.st_size < (off_t)sizeof(*shared)) {
		close(fd);
		return NULL;
	}
	void *addr = mmap(NULL, sizeof(*shared), PROT_READ, MAP_SHARED, fd, 0);
	close(fd);
	if (addr == MAP_FAILED) {
		return NULL;
	}
	shared = (const SharedState *)addr;
	return shared;
}

} // namespace detail

inline bool read(State *state, uint32_t max_age_ms)
{
	const detail::SharedState *shared = detail::map_reader();
	if (shared == NULL) {
		return false;
	}

	for (int attempt = 0; attempt < 3; attempt++) {
		uint32_t sequence = __atomic_load_n(&shared->sequence, __ATOMIC_ACQUIRE);
		if (sequence & 1U) {
			continue;
		}
		uint32_t magic = __atomic_load_n(&shared->magic, __ATOMIC_RELAXED);
		uint32_t version = __atomic_load_n(&shared->version, __ATOMIC_RELAXED);
		uint32_t updated_ms = __atomic_load_n(&shared->updated_ms, __ATOMIC_RELAXED);
		State value;
		value.dev_fps = __atomic_load_n(&shared->state.dev_fps, __ATOMIC_RELAXED);
		value.fps = __atomic_load_n(&shared->state.fps, __ATOMIC_RELAXED);
		value.width_gt = __atomic_load_n(&shared->state.width_gt, __ATOMIC_RELAXED);
		value.width_ls = __atomic_load_n(&shared->state.width_ls, __ATOMIC_RELAXED);
		value.height_gt = __atomic_load_n(&shared->state.height_gt, __ATOMIC_RELAXED);
		value.height_ls = __atomic_load_n(&shared->state.height_ls, __ATOMIC_RELAXED);
		uint32_t final_sequence = __atomic_load_n(&shared->sequence, __ATOMIC_ACQUIRE);
		if (sequence == final_sequence && !(final_sequence & 1U) &&
			magic == detail::magic && version == detail::version &&
			detail::monotonic_ms() - updated_ms <= max_age_ms) {
			*state = value;
			return true;
		}
	}
	return false;
}

} // namespace vi_state_shared

#endif // VI_STATE_SHARED_HPP_
