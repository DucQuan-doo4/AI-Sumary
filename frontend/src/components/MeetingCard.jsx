import { Link } from "react-router-dom";

export default function MeetingCard({ meeting }) {
  return (
    <Link to={`/meetings/${meeting.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{meeting.description || meeting.content || "No description"}</p>
        </div>
        <span className="text-xs text-slate-500">#{meeting.id}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : "No date"}</span>
        <span>{meeting.participant_user_ids?.length || 0} participant(s)</span>
      </div>
    </Link>
  );
}
