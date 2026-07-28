#include "internal/vi_state_shared.hpp"

#include <stdio.h>
#include <string.h>

namespace vi_state_shared {
namespace {

detail::SharedState *map_writer()
{
	static detail::SharedState *shared = NULL;
	if (shared != NULL) {
		return shared;
	}

	int fd = open(detail::path, O_CREAT | O_RDWR | O_CLOEXEC, 0644);
	if (fd < 0) {
		return NULL;
	}
	if (ftruncate(fd, sizeof(*shared)) != 0) {
		close(fd);
		return NULL;
	}
	void *addr = mmap(NULL, sizeof(*shared), PROT_READ | PROT_WRITE,
		MAP_SHARED, fd, 0);
	close(fd);
	if (addr == MAP_FAILED) {
		return NULL;
	}
	shared = (detail::SharedState *)addr;
	return shared;
}

void publish(const State &state)
{
	detail::SharedState *shared = map_writer();
	if (shared == NULL) {
		return;
	}

	uint32_t sequence = __atomic_load_n(&shared->sequence, __ATOMIC_RELAXED) | 1U;
	__atomic_store_n(&shared->sequence, sequence, __ATOMIC_SEQ_CST);
	__atomic_store_n(&shared->magic, detail::magic, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->version, detail::version, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->updated_ms, detail::monotonic_ms(), __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.dev_fps, state.dev_fps, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.fps, state.fps, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.width_gt, state.width_gt, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.width_ls, state.width_ls, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.height_gt, state.height_gt, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.height_ls, state.height_ls, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->sequence, sequence + 1U, __ATOMIC_RELEASE);
}

} // namespace

/* return 0 : VI not init;
 * return 1 : HDMI and CSI status are normal;
 * return 2 : HDMI abnormal;
 * return 3 : CSI abnormal: width too small;
 * return 4 : CSI abnormal: width too large;
 * return 5 : CSI abnormal: height too small;
 * return 6 : CSI abnormal: height too large;
 * return 7 : CSI abnormal: Unknown reason;
 */
uint8_t refresh()
{
	FILE *fp = fopen("/proc/cvitek/vi_dbg", "r");
	if (fp == NULL) {
		return 0;
	}

	State state = {};
	bool have_dev_fps = false;
	bool have_fps = false;
	char line[256];
	char field[32];
	unsigned int value;
	while (fgets(line, sizeof(line), fp) != NULL) {
		if (sscanf(line, "%31s : %u", field, &value) != 2) {
			continue;
		}
		if (strcmp(field, "VIDevFPS") == 0) {
			state.dev_fps = value;
			have_dev_fps = true;
		} else if (strcmp(field, "VIFPS") == 0) {
			state.fps = value;
			have_fps = true;
		} else if (strcmp(field, "VICsiCh0WidthGTCnt") == 0) {
			state.width_gt = value;
		} else if (strcmp(field, "VICsiCh0WidthLSCnt") == 0) {
			state.width_ls = value;
		} else if (strcmp(field, "VICsiCh0HeightGTCnt") == 0) {
			state.height_gt = value;
		} else if (strcmp(field, "VICsiCh0HeightLSCnt") == 0) {
			state.height_ls = value;
		}
	}
	fclose(fp);

	if (!have_dev_fps || !have_fps) {
		return 0;
	}
	publish(state);
	if (state.dev_fps == 0) return 2;
	if (state.fps != 0) return 1;
	if (state.width_gt != 0) return 3;
	if (state.width_ls != 0) return 4;
	if (state.height_gt != 0) return 5;
	if (state.height_ls != 0) return 6;
	return 7;
}

} // namespace vi_state_shared
