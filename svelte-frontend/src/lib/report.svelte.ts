import { apiJsonPost } from './init';
import { closeModal, openModal } from './play.svelte';

const DEFAULT_REASON = ':1';

/** The report form's state, rendered by `<ReportModel />`. */
export const reportForm = $state({
	/** The canned reason, or `''` when the player picked "Other (specify)". */
	reason: DEFAULT_REASON,
	customReason: ''
});

let reportData;

/**
 * Fills in and opens the report modal.
 * @param {*} [props]
 */
export function openReportForm(props) {
	reportData = props;
	reportForm.reason = DEFAULT_REASON;
	reportForm.customReason = '';
	openModal('reportModal');
}

/** Bound to `#reportForm` in `<ReportModel />`. */
export async function submitReport() {
	await apiJsonPost('report', {
		uuid: reportData?.uuid,
		original_msg: reportData?.msg,
		reason: reportForm.reason || reportForm.customReason,
		msg_id: reportData?.msgId
	}).then(
		(resp) => {
			if (!resp.ok) throw new Error(resp.statusText);
		},
		(err) => console.error(err)
	);

	reportForm.reason = DEFAULT_REASON;
	reportForm.customReason = '';
	closeModal();
}
