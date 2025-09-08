"use client";
import { useMemo, useState } from "react";

type Row = { url: string; validity: string; shortcode: string };
type Created = {
  shortcode: string;
  url: string;
  expiresAt: number;
  shortUrl: string;
};

export default function Home() {
  const [rows, setRows] = useState<Row[]>(
    Array.from({ length: 5 }, () => ({ url: "", validity: "", shortcode: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Created[]>([]);
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001",
    []
  );

  const handleChange = (index: number, field: keyof Row, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payloads = rows
        .map((r) => ({
          url: r.url.trim(),
          validity: r.validity.trim(),
          shortcode: r.shortcode.trim(),
        }))
        .filter((r) => r.url !== "");

      // simple client-side validation
      for (const p of payloads) {
        try {
          // Normalize URL if scheme missing for validation
          const candidate = /^https?:\/\//i.test(p.url)
            ? p.url
            : `http://${p.url}`;
          // eslint-disable-next-line no-new
          new URL(candidate);
          // validity integer if provided
          if (p.validity && !/^\d+$/.test(p.validity)) {
            throw new Error("Validity must be an integer");
          }
        } catch (e: any) {
          throw new Error(e.message || "Invalid input");
        }
      }

      const created: Created[] = [];
      for (const p of payloads) {
        const body: any = {
          url: /^https?:\/\//i.test(p.url) ? p.url : `http://${p.url}`,
        };
        if (p.validity) body.validity = Number(p.validity);
        if (p.shortcode) body.shortcode = p.shortcode;
        const res = await fetch(`${apiBase}/shorturls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Failed to create: ${p.url}`);
        const data = await res.json();
        created.push({
          shortcode: data.shortcode,
          url: data.url,
          expiresAt: data.expiresAt,
          shortUrl: data.shortUrl,
        });
      }
      setResults(created);
    } catch (e: any) {
      alert(e.message || "Validation or network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>URL Shortener</h1>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 150px 200px",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              placeholder="Long URL"
              value={row.url}
              onChange={(e) => handleChange(i, "url", e.target.value)}
              style={{ padding: 8 }}
            />
            <input
              type="text"
              placeholder="Validity (min)"
              value={row.validity}
              onChange={(e) => handleChange(i, "validity", e.target.value)}
              style={{ padding: 8 }}
            />
            <input
              type="text"
              placeholder="Preferred Shortcode"
              value={row.shortcode}
              onChange={(e) => handleChange(i, "shortcode", e.target.value)}
              style={{ padding: 8 }}
            />
          </div>
        ))}
        <button
          disabled={loading}
          onClick={handleSubmit}
          style={{ padding: "8px 12px" }}
        >
          {loading ? "Creating..." : "Create Short URLs"}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Results</h2>
          {results.map((r, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #eee",
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <strong>Original:</strong> {r.url}
              </div>
              <div>
                <strong>Short:</strong>{" "}
                <a href={r.shortUrl} target="_blank" rel="noreferrer">
                  {r.shortUrl}
                </a>
              </div>
              <div>
                <strong>Expires:</strong>{" "}
                {new Date(r.expiresAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
