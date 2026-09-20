import QuizBuilder from "@/components/mentor/QuizBuilder";

export const dynamic = "force-dynamic";

export default function MentorQuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quiz builder</h1>
        <p className="mt-1 text-sm text-muted">
          Build timed multiple-choice challenges. Correct answers live only in the database — mentees can&apos;t copy or inspect them.
        </p>
      </div>
      <QuizBuilder />
    </div>
  );
}