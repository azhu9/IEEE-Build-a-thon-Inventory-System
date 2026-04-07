"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Member = {
  id: string;
  name: string;
};

type Props = {
  teamId: string;
};

export default function TeamMembersPanel({ teamId }: Props) {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function fetchMembers() {
    const { data } = await supabase
      .from("team_members")
      .select("id, name")
      .eq("team_id", teamId)
      .order("created_at");
    setMembers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    await supabase
      .from("team_members")
      .insert({ team_id: teamId, name: newName.trim() });
    setNewName("");
    setAdding(false);
    fetchMembers();
  }

  async function handleDelete(id: string) {
    await supabase.from("team_members").delete().eq("id", id);
    fetchMembers();
  }

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-200">
      {loading && <p className="text-xs text-gray-400">Loading members...</p>}

      {/* Member list */}
      {members.length > 0 && (
        <ul className="mb-2 space-y-1">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700">{m.name}</span>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs ml-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && members.length === 0 && (
        <p className="text-xs text-gray-400 mb-2">No members added yet</p>
      )}

      {/* Add member input */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Member name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
