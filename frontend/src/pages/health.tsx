import { useEffect, useState } from 'react';
import { healthService, type HealthResponse } from '@/services/health';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthService.check();
      setHealth(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        <PageHeader
          title="Backend Health"
          description="Verify frontend-to-backend connectivity"
        />

        <Card>
          <CardHeader>
            <CardTitle>API Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading && (
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Checking backend...</span>
              </div>
            )}

            {health && (
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Backend Connected</p>
                  <p className="text-sm text-muted-foreground">Service: {health.service}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-red-600" />
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-muted p-4 font-mono text-xs">
              <p className="text-muted-foreground mb-2">Raw Response:</p>
              <pre>{JSON.stringify(health ?? { error: error ?? 'loading...' }, null, 2)}</pre>
            </div>

            <Button onClick={checkHealth} disabled={loading} variant="outline">
              <Loader2 className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">VITE_API_URL: {import.meta.env.VITE_API_URL ?? 'not set (using default)'}</Badge>
            <Badge variant="outline">Mode: {import.meta.env.MODE}</Badge>
            <Badge variant="outline">Dev: {import.meta.env.DEV ? 'true' : 'false'}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';