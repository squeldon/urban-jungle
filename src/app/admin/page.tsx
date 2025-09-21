'use client'
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function Page() {
  // Access the user object from the authentication context
  // const { user } = useAuthContext();
  const { user } = useAuthContext() as { user: any }; // Use 'as' to assert the type as { user: any }
  const router = useRouter();

  if (user == null) {
    return (
    <h1>Not logged in</h1>);
  }

  return (
    <h1>Only logged-in users can view this page</h1>
  );
}

export default Page;
