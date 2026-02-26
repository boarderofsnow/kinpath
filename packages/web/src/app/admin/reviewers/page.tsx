import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function AdminReviewersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: reviewers } = await supabase
    .from("reviewers")
    .select("id, full_name, credentials, specialty, verified, active, user_id")
    .order("full_name");

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reviewers</h1>
        <p className="mt-1 text-sm text-stone-500">
          {reviewers?.length ?? 0} physician reviewer{reviewers?.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card">
        {reviewers && reviewers.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Credentials</th>
                <th className="px-5 py-3">Specialty</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reviewers.map((reviewer) => (
                <tr key={reviewer.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-stone-900">{reviewer.full_name}</p>
                    <p className="text-xs text-stone-400 font-mono">{reviewer.id}</p>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{reviewer.credentials}</td>
                  <td className="px-5 py-3 text-stone-500">
                    {reviewer.specialty ?? <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {reviewer.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-stone-300" />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {reviewer.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-stone-400">
            No reviewers found. Add reviewers directly in the database.
          </div>
        )}
      </div>
    </div>
  );
}
