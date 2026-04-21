import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  emailValidationApi,
  getErrorMessage,
  isValidDomain,
  isValidEmail,
  normalizeDomain,
  type AllListsResponse,
  type FilterEmailResponse,
  type ManagedListName,
  type RootResponse,
  type ScoresResponse,
} from "../../lib/emailValidationApi";

type HealthState = "idle" | "loading" | "healthy" | "degraded";
type NoticeTone = "success" | "error";

interface Notice {
  id: string;
  tone: NoticeTone;
  message: string;
}

const MANAGED_LISTS: ManagedListName[] = ["whitelist", "blacklist"];
const READ_ONLY_LISTS = ["disposable", "spam_keywords"];

function toTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function verdictClasses(verdict: string) {
  const value = verdict.toLowerCase();

  if (value.includes("safe") || value.includes("valid")) {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  }

  if (value.includes("risk") || value.includes("spam") || value.includes("block")) {
    return "border-rose-400/40 bg-rose-500/10 text-rose-100";
  }

  return "border-amber-400/40 bg-amber-500/10 text-amber-100";
}

function metricTone(active: boolean) {
  return active
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
    : "border-slate-700 bg-slate-900/70 text-slate-300";
}

function serializeObject(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function ValidationDashboard() {
  const [rootInfo, setRootInfo] = useState<RootResponse | null>(null);
  const [healthState, setHealthState] = useState<HealthState>("idle");
  const [healthPayload, setHealthPayload] = useState<Record<string, unknown> | null>(null);

  const [email, setEmail] = useState("");
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<FilterEmailResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [spamLoading, setSpamLoading] = useState(false);

  const [lists, setLists] = useState<AllListsResponse | null>(null);
  const [listsLoading, setListsLoading] = useState(true);
  const [listInputs, setListInputs] = useState<Record<ManagedListName, string>>({
    whitelist: "",
    blacklist: "",
  });
  const [listBusyKey, setListBusyKey] = useState<string | null>(null);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoresNote, setScoresNote] = useState("");
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresSaving, setScoresSaving] = useState(false);
  const [scoresResetting, setScoresResetting] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const debouncedEmailRef = useRef<string>("");

  const emailIsValid = useMemo(() => isValidEmail(email), [email]);
  const isCrossOriginBaseUrl = useMemo(() => {
    try {
      return new URL(emailValidationApi.baseUrl, window.location.origin).origin !== window.location.origin;
    } catch {
      return false;
    }
  }, []);

  const pushNotice = (tone: NoticeTone, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotices((current) => [...current, { id, tone, message }]);

    window.setTimeout(() => {
      setNotices((current) => current.filter((notice) => notice.id !== id));
    }, 4000);
  };

  const refreshRootAndHealth = async () => {
    setHealthState("loading");

    try {
      const [root, health] = await Promise.all([
        emailValidationApi.root(),
        emailValidationApi.health(),
      ]);

      setRootInfo(root);
      setHealthPayload(health as Record<string, unknown>);
      setHealthState(String((health as Record<string, unknown>)?.status || "").toLowerCase() === "healthy" ? "healthy" : "degraded");
    } catch (error) {
      setHealthState("degraded");
      setHealthPayload({ error: getErrorMessage(error) });
    }
  };

  const refreshLists = async () => {
    setListsLoading(true);

    try {
      const response = await emailValidationApi.getLists();
      setLists(response);
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setListsLoading(false);
    }
  };

  const refreshScores = async () => {
    setScoresLoading(true);

    try {
      const response: ScoresResponse = await emailValidationApi.getScores();
      setScores(response.scores);
      setScoresNote(response.note);
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setScoresLoading(false);
    }
  };

  const runValidation = async (inputEmail?: string) => {
    const nextEmail = (inputEmail ?? email).trim();

    if (!isValidEmail(nextEmail)) {
      setValidationError("Enter a valid email address before running validation.");
      setValidationResult(null);
      return;
    }

    setValidationLoading(true);
    setValidationError(null);

    try {
      const response = await emailValidationApi.filterEmail(nextEmail);
      setValidationResult(response);
      debouncedEmailRef.current = nextEmail;
    } catch (error) {
      setValidationResult(null);
      setValidationError(getErrorMessage(error));
    } finally {
      setValidationLoading(false);
    }
  };

  const handleSpamReport = async () => {
    if (!validationResult?.email) {
      return;
    }

    setSpamLoading(true);

    try {
      await emailValidationApi.reportSpam({ email: validationResult.email });
      pushNotice("success", `${validationResult.email} was reported as spam.`);
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setSpamLoading(false);
    }
  };

  const handleListMutation = async (
    listName: ManagedListName,
    action: "add" | "remove",
    rawDomain?: string,
  ) => {
    const sourceValue = rawDomain ?? listInputs[listName];
    const domain = normalizeDomain(sourceValue);

    if (!isValidDomain(domain)) {
      pushNotice("error", `Enter a valid domain before updating ${listName}.`);
      return;
    }

    setListBusyKey(`${listName}-${action}-${domain}`);

    try {
      if (action === "add") {
        await emailValidationApi.addToList(listName, domain);
        pushNotice("success", `${domain} added to ${listName}.`);
      } else {
        await emailValidationApi.removeFromList(listName, domain);
        pushNotice("success", `${domain} removed from ${listName}.`);
      }

      setListInputs((current) => ({ ...current, [listName]: "" }));
      await refreshLists();
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setListBusyKey(null);
    }
  };

  const handleClearList = async (listName: string) => {
    setListBusyKey(`clear-${listName}`);

    try {
      await emailValidationApi.clearList(listName);
      pushNotice("success", `${toTitle(listName)} cleared.`);
      await refreshLists();
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setListBusyKey(null);
    }
  };

  const handleScoreChange = (key: string, value: string) => {
    setScores((current) => ({
      ...current,
      [key]: value === "" ? 0 : Number(value),
    }));
  };

  const handleSaveScores = async () => {
    setScoresSaving(true);

    try {
      const response = await emailValidationApi.updateScores(scores);
      pushNotice("success", response.message || "Scoring configuration updated.");
      await refreshScores();
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setScoresSaving(false);
    }
  };

  const handleResetScores = async () => {
    setScoresResetting(true);

    try {
      const response = await emailValidationApi.resetScores();
      setScores(response.default_scores);
      pushNotice("success", response.message || "Default scores restored.");
      await refreshScores();
    } catch (error) {
      pushNotice("error", getErrorMessage(error));
    } finally {
      setScoresResetting(false);
    }
  };

  useEffect(() => {
    refreshRootAndHealth();
    refreshLists();
    refreshScores();

    const intervalId = window.setInterval(() => {
      refreshRootAndHealth();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (trimmedEmail !== debouncedEmailRef.current) {
        runValidation(trimmedEmail);
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [email]);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(10,146,221,0.22),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(236,72,153,0.18),_transparent_30%)]" />

      <div className="container-custom py-14 md:py-20">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Validation Workbench
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
                Test emails, tune scoring, and manage domain rules from one page.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
                This dashboard is wired to the Laravel Mail Validation API and exposes the live
                validation, feedback, list, scoring, root, and health endpoints.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">API base</div>
                  <div className="mt-2 break-all text-sm text-slate-100">{emailValidationApi.baseUrl}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Handshake</div>
                  <div className="mt-2 text-sm text-slate-100">
                    {String(rootInfo?.message || "Loading API root response...")}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Health</div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-100">
                    <span
                      className={`inline-flex h-3 w-3 rounded-full ${
                        healthState === "healthy"
                          ? "bg-emerald-400"
                          : healthState === "loading"
                            ? "bg-amber-300"
                            : "bg-rose-400"
                      }`}
                    />
                    <span>{healthState === "idle" ? "Checking service..." : toTitle(healthState)}</span>
                  </div>
                </div>
              </div>

              {isCrossOriginBaseUrl ? (
                <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                  This page is calling a cross-origin API base URL. If the browser blocks requests,
                  route the validation service through a same-origin proxy or enable CORS on the
                  API.
                </div>
              ) : null}
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Service Status</h2>
              <p className="mt-2 text-sm text-slate-300">
                `/health` is polled every 30 seconds so this page surfaces reachability problems
                without a refresh.
              </p>
              <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
                {serializeObject(healthPayload || { status: "loading" })}
              </pre>
            </aside>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Email validation</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Submit an address to `POST /v1/filter-email`. Valid inputs also auto-run after
                    a short debounce.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  `FilterEmailResponse`
                </div>
              </div>

              <form
                className="mt-6 flex flex-col gap-3 md:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  runValidation();
                }}
              >
                <label className="sr-only" for="validation-email">
                  Email address
                </label>
                <input
                  id="validation-email"
                  type="email"
                  value={email}
                  onInput={(event) => setEmail((event.currentTarget as HTMLInputElement).value)}
                  placeholder="test@example.com"
                  className="min-h-[3.25rem] flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 text-white placeholder:text-slate-500"
                  aria-invalid={validationError ? "true" : "false"}
                />
                <button
                  type="submit"
                  disabled={validationLoading || !emailIsValid}
                  className="min-h-[3.25rem] rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 px-5 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validationLoading ? "Validating..." : "Validate email"}
                </button>
              </form>

              {validationError ? (
                <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {validationError}
                </p>
              ) : null}

              {validationResult ? (
                <div className="mt-6 space-y-5">
                  <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm text-slate-400">{validationResult.email}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${verdictClasses(
                            validationResult.verdict,
                          )}`}
                        >
                          {validationResult.verdict}
                        </span>
                        <span className="text-sm text-slate-300">
                          Score <strong className="text-white">{validationResult.score}</strong>
                        </span>
                        <span className="text-sm text-slate-300">
                          Domain <strong className="text-white">{validationResult.domain}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSpamReport}
                      disabled={spamLoading}
                      className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {spamLoading ? "Reporting..." : "Report as spam"}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Disposable", validationResult.disposable],
                      ["MX exists", validationResult.mx_exists],
                      ["SMTP valid", validationResult.smtp_valid],
                      ["Gibberish", validationResult.gibberish],
                      ["New domain", validationResult.new_domain],
                      ["Spam keywords", validationResult.spam_keywords],
                      ["Whitelisted", validationResult.whitelisted],
                      ["Blacklisted", validationResult.blacklisted],
                    ].map(([label, active]) => (
                      <div
                        key={String(label)}
                        className={`rounded-2xl border p-4 ${metricTone(Boolean(active))}`}
                      >
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {label}
                        </div>
                        <div className="mt-2 text-lg font-semibold">
                          {Boolean(active) ? "Yes" : "No"}
                        </div>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Domain age
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        {validationResult.domain_age_in_days === null
                          ? "Unknown"
                          : `${validationResult.domain_age_in_days} days`}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Reputation penalty
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        {validationResult.reputation_penalty}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200 sm:col-span-2 xl:col-span-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        MX records
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {validationResult.mx_records.length > 0
                          ? validationResult.mx_records.join(", ")
                          : "No MX records returned"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                  Run a validation to inspect verdict, score, MX records, and risk flags.
                </div>
              )}
            </div>

            <div className="space-y-8">
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Lists</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Manage allow and block rules with `GET`, `POST`, and `DELETE` calls under
                      `/v1/lists`.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshLists}
                    disabled={listsLoading}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {listsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {MANAGED_LISTS.map((listName) => (
                    <div key={listName} className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{toTitle(listName)}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Current size: {lists?.[listName]?.length ?? 0}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClearList(listName)}
                          disabled={listBusyKey === `clear-${listName}`}
                          className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {listBusyKey === `clear-${listName}` ? "Clearing..." : "Clear list"}
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 md:flex-row">
                        <label className="sr-only" for={`${listName}-domain`}>
                          {toTitle(listName)} domain
                        </label>
                        <input
                          id={`${listName}-domain`}
                          value={listInputs[listName]}
                          onInput={(event) =>
                            setListInputs((current) => ({
                              ...current,
                              [listName]: (event.currentTarget as HTMLInputElement).value,
                            }))
                          }
                          placeholder="example.org"
                          className="min-h-[3rem] flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 text-white placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleListMutation(listName, "add")}
                          disabled={listBusyKey?.startsWith(`${listName}-`)}
                          className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListMutation(listName, "remove")}
                          disabled={listBusyKey?.startsWith(`${listName}-`)}
                          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(lists?.[listName] || []).length > 0 ? (
                          (lists?.[listName] || []).map((domain) => (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => handleListMutation(listName, "remove", domain)}
                              disabled={listBusyKey === `${listName}-remove-${domain}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200 transition hover:border-rose-400/30 hover:bg-rose-500/10"
                              aria-label={`Remove ${domain} from ${listName}`}
                            >
                              {domain}
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">No domains in this list.</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {READ_ONLY_LISTS.map((listName) => (
                    <div key={listName} className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{toTitle(listName)}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Read-only view from `GET /v1/lists`.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClearList(listName)}
                          disabled={listBusyKey === `clear-${listName}`}
                          className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {listBusyKey === `clear-${listName}` ? "Clearing..." : "Clear list"}
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(lists?.[listName] || []).length > 0 ? (
                          (lists?.[listName] || []).map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">No items in this list.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Scoring</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Edit the values returned by `GET /v1/scores` and persist them with
                      `POST /v1/scores`.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    Restart required after save
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-400">{scoresNote}</p>

                {scoresLoading ? (
                  <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                    Loading scoring configuration...
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(scores).map(([key, value]) => (
                        <label
                          key={key}
                          className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300"
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                            {toTitle(key)}
                          </span>
                          <input
                            type="number"
                            value={String(value)}
                            onInput={(event) =>
                              handleScoreChange(key, (event.currentTarget as HTMLInputElement).value)
                            }
                            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-base font-semibold text-white"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={handleSaveScores}
                        disabled={scoresSaving}
                        className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-400 to-orange-300 px-5 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {scoresSaving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetScores}
                        disabled={scoresResetting}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {scoresResetting ? "Resetting..." : "Reset to defaults"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto flex max-w-xl flex-col gap-3 px-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              notice.tone === "success"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-50"
                : "border-rose-400/30 bg-rose-500/15 text-rose-50"
            }`}
          >
            {notice.message}
          </div>
        ))}
      </div>
    </div>
  );
}
