import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AccountSettingsPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>계정 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">이메일 변경</label>
            <Input
              placeholder="새 이메일 주소"
              type="email"
              disabled
            />
            <p className="text-xs text-muted-foreground">준비 중</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">비밀번호 변경</label>
            <Input
              placeholder="새 비밀번호"
              type="password"
              disabled
            />
            <p className="text-xs text-muted-foreground">준비 중</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
