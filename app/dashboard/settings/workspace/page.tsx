"use client";

// This is a placeholder for the workspace settings page.
// We will build this out in the next steps.

import { WorkspaceForm } from "./workspace-form";

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Workspace Setup</h3>
        <p className="text-sm text-muted-foreground">
          Configure your growth engine by providing the necessary API keys and settings.
        </p>
      </div>
      <WorkspaceForm />
    </div>
  );
}
