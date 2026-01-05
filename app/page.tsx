import URLShortener from "@/components/URLShortener";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shorten Your URLs
          </h1>
          <p className="text-xl text-gray-600">
            Create short, memorable links for your long URLs
          </p>
        </div>
        <URLShortener />
      </main>
    </div>
  );
}
