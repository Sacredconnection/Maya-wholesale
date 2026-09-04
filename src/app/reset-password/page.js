import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Create New Password | Maya Herbs Wholesale",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const login = typeof params?.login === "string" ? params.login : "";
  const resetKey = typeof params?.key === "string" ? params.key : "";
  return <ResetPasswordForm login={login} resetKey={resetKey} />;
}
