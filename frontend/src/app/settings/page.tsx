import ApiKeyManager from '../../components/settings/ApiKeyManager';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your workspace configuration and security credentials.
        </p>
      </div>

      <ApiKeyManager />
    </div>
  );
}
