import { useState } from "react";
import { Link } from "react-router-dom";
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

  const handleReset = () => {
    setKeyword("");
    setSearch("");
    setPage(0);
  };

  const shown = data?.content.length ?? 0;
  const total = data?.totalElements ?? 0;

  return (
    <Layout>
      <div className="max-w-300 mx-auto px-5 md:px-10 pt-12 md:pt-16 pb-24 space-y-10">
        <div>
          <h1
            className="m-0 text-[32px] md:text-[40px] font-semibold text-spa-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Our services
          </h1>
          <p className="mt-2 mb-0 text-base text-spa-muted">
            Find a treatment, or jump back to the ones you love.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          role="search"
          aria-label="Find a service"
          className="flex items-end gap-3 max-w-140"
        >
          <div className="flex-1 flex flex-col gap-1.5">
            <label
              htmlFor="service-search"
              className="text-[13px] font-medium text-spa-text"
            >
              Search services
            </label>
            <Input
              id="service-search"
              type="search"
              name="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Try massage, facial or scrub"
              className="min-h-12 rounded-xl text-base"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <section aria-labelledby="all-services" className="space-y-6">
          <div>
            <h2
              id="all-services"
              className="m-0 text-[22px] font-semibold text-spa-ink"
            >
              {search ? `Results for "${search}"` : "All services"}
            </h2>
            {data && (
              <p
                className="mt-0.5 mb-0 text-sm text-spa-muted"
                aria-live="polite"
              >
                Showing {shown} of {total} services
              </p>
            )}
          </div>

          <Loading isLoading={isLoading} />

          {isLoading ? null : isError ? (
            <p className="text-sm text-spa-danger">Could not load services.</p>
          ) : !data?.content.length ? (
            <div className="bg-white border-[1.5px] border-dashed border-spa-border-strong rounded-2xl px-6 py-12 text-center flex flex-col items-center gap-2">
              <div className="text-lg font-semibold text-spa-ink">
                No services match your search
              </div>
              <p className="m-0 max-w-105 text-[15px] leading-normal text-spa-muted">
                Try a different word, or clear the search to see everything we
                offer.
              </p>
              {search && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2.5 min-h-11 px-5 rounded-[10px] border border-spa-border-strong bg-white text-[15px] font-semibold text-spa-ink cursor-pointer hover:bg-spa-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="list-none m-0 p-0 grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
                {data.content.map((service) => (
                  <li key={service.id} className="flex">
                    <article className="w-full bg-white border border-spa-line rounded-2xl overflow-hidden flex flex-col">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt=""
                          className="h-32.5 w-full object-cover flex-none"
                        />
                      ) : (
                        <div
                          role="img"
                          aria-label={`Image placeholder for ${service.name}`}
                          className="h-32.5 flex-none flex items-center justify-center bg-spa-green-50 text-spa-green-800"
                        >
                          <svg
                            aria-hidden="true"
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 21c-4.5-2-7-5.5-7-9.5C5 8 7.5 5 12 3c4.5 2 7 5 7 8.5 0 4-2.5 7.5-7 9.5z" />
                            <path d="M12 8v13" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.25 px-4.5 pt-4 pb-4.5">
                        <h3 className="m-0 text-[17px] font-semibold text-spa-ink">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="m-0 text-sm leading-[1.45] text-spa-muted line-clamp-3">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span className="text-sm text-spa-text">
                            {service.durationMinutes} min
                          </span>
                          <span
                            className="text-[21px] font-semibold text-spa-ink"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        <Link
                          to={`/services/${service.id}/book`}
                          className="mt-3 flex items-center justify-center min-h-11.5 px-4 rounded-[10px] bg-spa-green text-white text-[15px] font-semibold no-underline hover:bg-spa-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spa-green"
                        >
                          Book
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>

              <div className="pt-8 pb-4">
                <Pagination
                  page={data.number}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default CustomerServices;
