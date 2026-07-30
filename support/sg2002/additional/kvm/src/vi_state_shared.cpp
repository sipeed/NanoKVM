#include "vi_state_shared.hpp"
#include "internal/vi_state_writer.hpp"

#include <sys/file.h>

namespace vi_state_shared {
namespace {

void log_once(bool *logged, const char *message)
{
	if (!__atomic_exchange_n(logged, true, __ATOMIC_RELAXED)) {
		fprintf(stderr, "[vi_state] %s\n", message);
	}
}

void reset_log_once(bool *logged)
{
	__atomic_store_n(logged, false, __ATOMIC_RELAXED);
}

bool publish(const State &state)
{
	static bool logged_open_failed = false;
	static bool logged_lock_failed = false;
	static bool logged_file_failed = false;
	static bool logged_size_failed = false;
	static bool logged_map_failed = false;

	int fd = open(shared_path(), O_CREAT | O_RDWR | O_CLOEXEC | O_NOFOLLOW, 0600);
	if (fd < 0) {
		log_once(&logged_open_failed, "cannot open shared state");
		return false;
	}
	if (flock(fd, LOCK_EX) != 0) {
		log_once(&logged_lock_failed, "cannot lock shared state");
		close(fd);
		return false;
	}

	struct stat stat_buf;
	if (fstat(fd, &stat_buf) != 0 || !S_ISREG(stat_buf.st_mode) || fchmod(fd, 0600) != 0) {
		log_once(&logged_file_failed, "shared state is not a private regular file");
		close(fd);
		return false;
	}
	if (ftruncate(fd, sizeof(detail::SharedState)) != 0) {
		log_once(&logged_size_failed, "cannot size shared state");
		close(fd);
		return false;
	}

	void *addr = mmap(NULL, sizeof(detail::SharedState), PROT_READ | PROT_WRITE,
		MAP_SHARED, fd, 0);
	if (addr == MAP_FAILED) {
		log_once(&logged_map_failed, "cannot map shared state");
		close(fd);
		return false;
	}

	detail::SharedState *shared = (detail::SharedState *)addr;
	uint32_t sequence = __atomic_load_n(&shared->sequence, __ATOMIC_RELAXED);
	sequence = (sequence & ~1U) + 1U;
	__atomic_store_n(&shared->sequence, sequence, __ATOMIC_RELAXED);
	__atomic_thread_fence(__ATOMIC_RELEASE);
	__atomic_store_n(&shared->magic, detail::SHARED_MAGIC, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->version, detail::SHARED_VERSION, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->updated_ms, monotonic_ms(), __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.dev_fps, state.dev_fps, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.fps, state.fps, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.width_gt, state.width_gt, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.width_ls, state.width_ls, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.height_gt, state.height_gt, __ATOMIC_RELAXED);
	__atomic_store_n(&shared->state.height_ls, state.height_ls, __ATOMIC_RELAXED);
	__atomic_thread_fence(__ATOMIC_RELEASE);
	__atomic_store_n(&shared->sequence, sequence + 1U, __ATOMIC_RELAXED);

	munmap(addr, sizeof(detail::SharedState));
	close(fd);
	reset_log_once(&logged_open_failed);
	reset_log_once(&logged_lock_failed);
	reset_log_once(&logged_file_failed);
	reset_log_once(&logged_size_failed);
	reset_log_once(&logged_map_failed);
	return true;
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
	static bool logged_open_failed = false;
	static bool logged_no_fields = false;
	static bool logged_missing_fields = false;
	static bool logged_publish_failed = false;

	State state = {};
	uint32_t fields = FIELD_NONE;
	ProcReadStatus status = read_proc_state(&state, &fields);
	if (status == PROC_READ_OPEN_FAILED) {
		log_once(&logged_open_failed, "cannot open /proc/cvitek/vi_dbg");
		return 0;
	}
	if (status == PROC_READ_NO_KNOWN_FIELDS) {
		log_once(&logged_no_fields, "no known fields in /proc/cvitek/vi_dbg");
		return 0;
	}
	if ((fields & (FIELD_DEV_FPS | FIELD_FPS)) != (FIELD_DEV_FPS | FIELD_FPS)) {
		log_once(&logged_missing_fields, "missing VIDevFPS or VIFPS in /proc/cvitek/vi_dbg");
		return 0;
	}
	if (!publish(state)) {
		log_once(&logged_publish_failed, "cannot publish VI state");
		return 0;
	}

	reset_log_once(&logged_open_failed);
	reset_log_once(&logged_no_fields);
	reset_log_once(&logged_missing_fields);
	reset_log_once(&logged_publish_failed);
	return classify(state);
}

} // namespace vi_state_shared
