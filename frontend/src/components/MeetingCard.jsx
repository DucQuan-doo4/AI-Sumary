import { Link } from "react-router-dom";

import UserAvatar from "./UserAvatar.jsx";

export default function MeetingCard({ meeting }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400">
      <Link to={`/meetings/${meeting.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{meeting.summary || meeting.description || "No summary yet"}</p>
          </div>
          <span className="text-xs text-slate-500">#{meeting.id}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>{meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString() : "No date"}</span>
          <span>{meeting.participant_user_ids?.length || 0} participant(s)</span>
        </div>
      </Link>
      <ParticipantStack participants={meeting.participants || []} />
      <div className="mt-3 flex flex-wrap gap-2">
        {meeting.category && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{meeting.category}</span>}
        {meeting.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{tag}</span>
        ))}
      </div>
    </article>
  );
}

function ParticipantStack({ participants }) {
  if (!participants.length) return null;

  return (
    <div className="mt-4 flex items-center">
      {participants.slice(0, 6).map((participant) => (
        <div key={participant.id} className="group relative -ml-2 first:ml-0">
          <UserAvatar user={participant} size="small" />
          <div className="pointer-events-none absolute left-1/2 z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg group-hover:block">
            <p className="font-semibold text-slate-900">{participant.full_name || participant.email}</p>
            <p className="mt-1 text-slate-500">{participant.email}</p>
            <p className="mt-2 text-slate-600">{participant.department || "No department"} · {participant.room || "No room"}</p>
            <p className="mt-1 text-slate-500">{participant.role}</p>
          </div>
        </div>
      ))}
      {participants.length > 6 && (
        <span className="-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-semibold text-slate-700">
          +{participants.length - 6}
        </span>
      )}
    </div>
  );
}
