import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { getUserId } from "~/services/session.server";
import { generateMeta } from "~/utils/meta";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await getUserId(request);
	if (userId) {
		return redirect("/dashboard");
	}
	return null;
};

export const meta: MetaFunction = () => {
	return generateMeta({
		title: "Login | Remix Boilerplate",
		description: "Login to the app",
	});
};

export default function Index() {
	return (
		<div className="flex h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-4xl font-bold tracking-tight">
						Welcome to the Application
					</h1>
					<p className="mt-4 text-lg opacity-75">
						Please sign in to access your dashboard.
					</p>
				</div>
				<div className="flex justify-center btn-group">
					<Link to="/about" className="btn-secondary text-center">
						About
					</Link>
				</div>
			</div>
		</div>
	);
}