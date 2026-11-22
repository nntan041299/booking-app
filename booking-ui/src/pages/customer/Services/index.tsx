import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Layout from "@/layouts/Layout";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import { searchServices } from "@/service/catalog";

const formatPrice = (price: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(price);

const CustomerServices = () => {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["services", search, page],
    queryFn: () => searchServices({ keyword: search, page }),
    placeholderData: keepPreviousData,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(keyword.trim());
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-surface-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Our services
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Browse what the shop offers.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              name="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search services"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Loading isLoading={isLoading} />

        {isLoading ? null : isError ? (
          <p className="text-sm text-red-600">Could not load services.</p>
        ) : !data?.content.length ? (
          <p className="text-sm text-surface-500">No services found.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.content.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-surface-200 p-5 flex flex-col gap-3"
                >
                  <h2
                    className="text-base font-semibold text-surface-900"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className="text-sm text-surface-500 line-clamp-3">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="text-surface-500">
                      <i className="pi pi-clock text-xs mr-1.5" />
                      {service.durationMinutes} min
                    </span>
                    <span className="font-semibold text-surface-900">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default CustomerServices;
