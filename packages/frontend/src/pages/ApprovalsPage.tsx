import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';

export default function ApprovalsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const response = await api.approvals.listPending();
      return response.data.approvals;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approvals.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => api.approvals.deny(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
        Error loading approvals
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pending Approvals
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and approve AI actions before they're executed
        </p>
      </div>

      {!data || data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">No pending approvals</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            All clear! Your AI coach will ask for approval when making changes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((approval: any) => (
            <div
              key={approval.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {approval.tool_name}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Action details:
                    </p>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(approval.tool_args, null, 2)}
                    </pre>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                    Requested at: {new Date(approval.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(approval.id)}
                    disabled={approveMutation.isPending || denyMutation.isPending}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyMutation.mutate(approval.id)}
                    disabled={approveMutation.isPending || denyMutation.isPending}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
