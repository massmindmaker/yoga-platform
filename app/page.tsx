import StudentMainPage from "@/app/(student)/page";
import StudentLayout from "@/app/(student)/layout";

export default function Home() {
  return (
    <StudentLayout>
      <StudentMainPage />
    </StudentLayout>
  );
}
