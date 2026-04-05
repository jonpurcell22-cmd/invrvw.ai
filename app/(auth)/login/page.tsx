import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-24 animate-shimmer rounded" />
        <div className="mt-3 h-4 w-full max-w-xs animate-shimmer rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 animate-shimmer rounded-lg" />
          <div className="h-10 animate-shimmer rounded-lg" />
          <div className="h-10 animate-shimmer rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
