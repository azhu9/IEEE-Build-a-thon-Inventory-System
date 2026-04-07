"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import TeamMembersPanel from "./TeamMembersPanel";

type Team = {
  id: string;
  name: string;
  group_code: string;
  contact_email: string;
  budget_total: number;
  budget_used: number;
  created_at: string;
};

export default function TeamsManager() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("100");
  const [error, setError] = useState("");

  async function fetchTeams() {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });
    setTeams(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generateCode(teamName: string) {
    const prefix = teamName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${suffix}`;
  }

  async function handleCreate() {
    if (!name.trim() || !email.trim()) {
      setError("Team name and email are required.");
      return;
    }
    setCreating(true);
    setError("");

    const group_code = generateCode(name);

    const { error: insertError } = await supabase.from("teams").insert({
      name: name.trim(),
      contact_email: email.trim(),
      budget_total: parseFloat(budget),
      budget_used: 0,
      group_code,
    });

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    setName("");
    setEmail("");
    setBudget("100");
    setShowForm(false);
    setCreating(false);
    fetchTeams();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    await supabase.from("teams").delete().eq("id", id);
    fetchTeams();
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function toggleExpand(teamId: string) {
    setExpandedTeam((prev) => (prev === teamId ? null : teamId));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
        >
          {showForm ? "Cancel" : "+ New team"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold mb-4">Create new team</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <input
              type="email"
              placeholder="Contact email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap"
              >
                {creating ? "Creating..." : "Create team"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* Teams table */}
      {loading && <p className="text-gray-400 text-sm">Loading teams...</p>}
      {!loading && teams.length === 0 && (
        <p className="text-gray-400 text-center py-12">No teams yet</p>
      )}
      {teams.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-gray-600">
              <th className="py-3 px-3">Team name</th>
              <th className="py-3 px-3">Group code</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Budget</th>
              <th className="py-3 px-3">Spent</th>
              <th className="py-3 px-3">Remaining</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <>
                <tr
                  key={team.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(team.id)}
                >
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {expandedTeam === team.id ? "▲" : "▼"}
                      </span>
                      {team.name}
                    </div>
                  </td>
                  <td
                    className="py-3 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs tracking-widest">
                        {team.group_code}
                      </span>
                      <button
                        onClick={() => copyCode(team.group_code)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors text-xs"
                      >
                        {copiedCode === team.group_code ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-500">
                    {team.contact_email}
                  </td>
                  <td className="py-3 px-3">${team.budget_total.toFixed(2)}</td>
                  <td className="py-3 px-3 text-gray-500">
                    ${team.budget_used.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-medium ${
                        team.budget_total - team.budget_used <= 0
                          ? "text-red-500"
                          : team.budget_total - team.budget_used < 20
                            ? "text-amber-500"
                            : "text-emerald-600"
                      }`}
                    >
                      ${(team.budget_total - team.budget_used).toFixed(2)}
                    </span>
                  </td>
                  <td
                    className="py-3 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Expanded members panel */}
                {expandedTeam === team.id && (
                  <tr
                    key={`${team.id}-members`}
                    className="bg-gray-50 border-b border-gray-100"
                  >
                    <td colSpan={7} className="px-6 py-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Team members
                      </p>
                      <TeamMembersPanel teamId={team.id} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
