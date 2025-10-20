"use client";
import { useRouter } from "next/navigation";

function Admin() {
	const router = useRouter();

	router.push("/admin/drivers");

	return <div>Redirecting</div>;
}

export default Admin;
