import AssessmentFlow from "@/components/assessment/AssessmentFlow";
import type { InjuryType } from "@/types";

interface Props {
  params: Promise<{ injury_type: string }>;
}

export default async function AssessmentPage({ params }: Props) {
  const { injury_type } = await params;
  return <AssessmentFlow injuryType={injury_type as InjuryType} />;
}
