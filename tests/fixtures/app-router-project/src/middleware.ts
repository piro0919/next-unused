import { isAdminPath } from "./lib/paths";

// An entry point Next.js loads by name: it and what it imports are in use.
export default function middleware(request: { nextUrl: { pathname: string } }) {
  return isAdminPath(request.nextUrl.pathname);
}
