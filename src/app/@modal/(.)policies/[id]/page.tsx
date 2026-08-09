import PolicyDetailPage from "@/app/policies/[id]/page";
import { PolicyDetailModal } from "@/components/policies/policy-detail-modal";

type PolicyModalPageProps = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default function PolicyModalPage(props: PolicyModalPageProps) {
  return (
    <PolicyDetailModal>
      <PolicyDetailPage {...props} />
    </PolicyDetailModal>
  );
}
