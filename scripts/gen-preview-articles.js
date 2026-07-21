/**
 * Generate PREVIEW articles (backlog P0–P3). Run: node scripts/gen-preview-articles.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "pages", "articles");

const banner = `          <p class="article-preview-banner">
            <strong>Preview</strong>
            Bản nháp chờ review — title, nội dung, link có thể sửa trước khi bỏ nhãn.
          </p>
`;

function art(metaTitle, desc, h1, minutes, body) {
  return `---
{
  "title": ${JSON.stringify(metaTitle + " · Articles")},
  "description": ${JSON.stringify("[Preview] " + desc)},
  "page": "articles",
  "scripts": []
}
---
<article class="container">
        <header class="article-header animate-in">
          <a class="article-header__back" href="/articles/">← Articles</a>
          <h1>${h1}</h1>
          <p class="article-header__meta">PREVIEW · 2026-07-21 · ~${minutes} phút đọc</p>
        </header>

        <div class="article-body animate-in animate-in-delay-1">
${banner}${body}
        </div>
      </article>
`;
}

/** @type {Array<[string, string]>} */
const files = [];

function add(slug, metaTitle, desc, h1, minutes, body) {
  files.push([slug, art(metaTitle, desc, h1, minutes, body)]);
}

// ——— P0 ———
add(
  "symptom-map.html",
  "Bạn đang gặp gì? — chậm, RAM, double, view sai, consumer kẹt",
  "Hub triệu chứng → bài liên quan. Cửa vào khi đang cháy.",
  "Bạn đang gặp gì? — chậm, RAM, double, view sai, consumer kẹt",
  5,
  `          <p>
            Index xếp theo <em>chủ đề học</em>. Lúc production cháy bạn nghĩ theo
            <strong>triệu chứng</strong>. Trang này: chọn nỗi → vài bài đủ bước đầu.
          </p>

          <h2>Service / API chậm, p99 nổ</h2>
          <ol>
            <li>
              Chờ (I/O) hay tính (CPU)? →
              <a href="/articles/concurrency-vs-parallel.html">deal vs do</a>,
              <a href="/articles/blocking-vs-nonblocking.html">block/non-block</a>.
            </li>
            <li>
              Deadline xuyên tầng? →
              <a href="/articles/timeout-budget.html">timeout budget</a>,
              <a href="/articles/cancellation.html">cancellation</a> (preview).
            </li>
            <li>
              Dependency yếu? →
              <a href="/articles/circuit-breaker.html">breaker</a>,
              <a href="/articles/retry-backoff-jitter.html">retry</a>,
              <a href="/articles/retry-what-when.html">retry cái gì</a> (preview).
            </li>
            <li>
              DB pool hết chỗ? →
              <a href="/articles/connection-pool-exhaustion.html">connection pool</a>
              (preview).
            </li>
          </ol>
          <p>
            Checklist dài:
            <a href="/articles/slow-service-playbook.html">playbook service chậm</a>
            (preview).
          </p>

          <h2>RAM tăng, OOM</h2>
          <ul>
            <li>
              Việc đang bay? →
              <a href="/articles/unbounded-inflight.html">unbounded</a>,
              <a href="/articles/inflight-inventory.html">in-flight inventory</a>
              (preview),
              <a href="/articles/promise-all-batch-vs-pool.html">pool</a>.
            </li>
            <li>
              Số RAM? →
              <a href="/articles/linux-vss-rss-uss.html">VSS/RSS/USS</a>,
              <a href="/articles/heap-rss-cgroup.html">heap vs RSS vs cgroup</a>
              (preview),
              <a href="/articles/garbage-collector.html">GC</a>.
            </li>
          </ul>

          <h2>Double side-effect</h2>
          <ul>
            <li>
              <a href="/articles/idempotency.html">Idempotency</a>,
              <a href="/articles/idempotency-key-scope.html">key scope</a> (preview).
            </li>
            <li>
              Redelivery →
              <a href="/articles/visibility-timeout.html">lease</a>,
              <a href="/articles/exactly-once-pragmatic.html">exactly-once thực dụng</a>
              (preview).
            </li>
            <li>
              DB + publish →
              <a href="/articles/outbox-inbox.html">outbox</a>,
              <a href="/articles/dual-write-vs-outbox.html">dual-write</a> (preview).
            </li>
          </ul>

          <h2>View sai, ghi vẫn 200</h2>
          <ul>
            <li>
              <a href="/articles/stale-missing-wrong.html">Stale · thiếu · sai</a>
              (preview).
            </li>
            <li>
              <a href="/articles/write-vs-read-channel.html">Write / read / shared</a>.
            </li>
            <li>
              <a href="/articles/order-budget.html">Order budget</a>,
              <a href="/articles/consumer-lag.html">consumer lag</a> (preview).
            </li>
          </ul>

          <h2>Consumer kẹt / lag</h2>
          <ul>
            <li>
              <a href="/articles/unblock.html">Unblock</a> (preview).
            </li>
            <li>
              <a href="/articles/poison-dlq.html">Poison / DLQ</a>,
              <a href="/articles/dlq-triage.html">DLQ triage</a> (preview).
            </li>
            <li>
              <a href="/articles/async-recovery-playbook.html">Recovery playbook</a>,
              <a href="/articles/ignore-when-ok.html">ignore khi nào đúng</a>
              (preview).
            </li>
          </ul>

          <h2>Dependency kéo sập mình</h2>
          <ul>
            <li>
              <a href="/articles/circuit-breaker.html">Breaker</a>,
              <a href="/articles/breaker-failure-modes.html">fail modes</a> (preview).
            </li>
            <li>
              <a href="/articles/bulkhead.html">Bulkhead</a>,
              <a href="/articles/load-shedding.html">load shedding</a> (preview).
            </li>
            <li>
              <a href="/articles/backpressure.html">Backpressure</a>,
              <a href="/articles/rate-limit-vs-pool.html">rate limit vs pool</a>
              (preview).
            </li>
          </ul>

          <h2>Race / stampede</h2>
          <ul>
            <li><a href="/articles/toctou-async.html">TOCTOU</a>.</li>
            <li>
              <a href="/articles/cache-stampede.html">Cache stampede</a> (preview),
              <a href="/articles/reuse-promise.html">single-flight</a>.
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Triệu chứng trước, tên pattern sau.</strong>
            Hỏi: chờ hay tính? bay bao nhiêu? còn bao lâu? fail được phép gì?
            view lệch kiểu nào?
          </p>
`
);

add(
  "stale-missing-wrong.html",
  "Stale · thiếu · sai — ba kiểu data hỏng",
  "Read model hỏng: stale, missing, wrong, uncertain — recovery khác nhau.",
  "Stale · thiếu · sai — ba kiểu data hỏng (và “chưa chắc”)",
  6,
  `          <p>
            Ghi 200 nhưng user kêu data sai. Trên
            <a href="/articles/write-vs-read-channel.html">read side</a>
            “sai” không một bệnh — ít nhất <strong>ba kiểu + uncertain</strong>.
          </p>

          <h2>Bốn ô</h2>
          <pre><code>Stale      — từng đúng, giờ cũ (lag)
Missing    — lẽ ra phải có, không có (gap, skip)
Wrong      — có nhưng sai nghĩa (order, double apply)
Uncertain  — in-flight / timeout / “có thể đã”</code></pre>

          <h2>Stale</h2>
          <p>
            Lag consumer, cache, replica. Write vẫn chạy; user thấy bản cũ.
            Thường chấp nhận hơn wrong nếu SLA stale rõ. Đo:
            <a href="/articles/consumer-lag.html">consumer lag</a> (preview).
          </p>

          <h2>Missing</h2>
          <p>
            Ignore, filter bug, DLQ không backfill, mất publish.
            <a href="/articles/ignore-when-ok.html">Ignore</a> trên read gần
            cấm nếu view phải đủ.
          </p>

          <h2>Wrong</h2>
          <p>
            Double apply, out-of-order, map sai. User <em>tin</em> số sai.
            Cần
            <a href="/articles/idempotency.html">idempotent handler</a>,
            <a href="/articles/order-budget.html">order budget</a>, đôi khi
            rebuild.
          </p>

          <h2>Uncertain</h2>
          <p>
            Timeout sau commit có thể; at-least-once đang bay. Đừng spam retry
            không key — xem
            <a href="/articles/exactly-once-pragmatic.html">exactly-once thực dụng</a>.
          </p>

          <h2>Gắn recovery</h2>
          <pre><code>Stale     → throughput / chấp nhận SLA
Missing   → gap + backfill
Wrong     → fix handler, rebuild
Uncertain → idempotent tra cứu, không đoán</code></pre>
          <p>
            <a href="/articles/async-recovery-playbook.html">Recovery playbook</a>.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Đừng chỉ nói “data sai” — nói stale, thiếu, wrong, hay chưa chắc.</strong>
          </p>
`
);

add(
  "cancellation.html",
  "Cancellation — hết giờ phải dừng việc",
  "Timeout budget báo hết giờ; cancel abort work. AbortSignal, việc mồ côi.",
  "Cancellation — hết giờ thì phải dừng việc, không chỉ báo lỗi",
  6,
  `          <p>
            <a href="/articles/timeout-budget.html">Timeout budget</a>:
            <em>còn bao lâu?</em>
            <strong>Cancellation</strong>:
            <em>việc đang chạy có dừng không?</em>
          </p>
          <p>
            Client cút, handler vẫn query 20s — budget hết trên giấy, pool vẫn
            bị ôm: việc <strong>mồ côi</strong>.
          </p>

          <h2>Timeout ≠ cancel</h2>
          <pre><code>await Promise.race([doWork(), timeout(2000)])
// doWork() có thể vẫn chạy sau khi race thua</code></pre>
          <p>
            Cancel đúng: tín hiệu xuống I/O và code tôn trọng
            (<code>AbortSignal</code>, <code>context.Context</code>).
          </p>

          <h2>Truyền signal</h2>
          <pre><code>const ac = new AbortController()
setTimeout(() => ac.abort(), 2000)
await fetch(url, { signal: ac.signal })
// mọi tầng con nhận cùng signal / ctx cha</code></pre>

          <h2>Cooperative</h2>
          <p>
            Cancel thường cooperative: check giữa các await. CPU loop không
            nhường = khó hủy — xem
            <a href="/articles/cooperative-vs-preemptive.html"
              >cooperative vs preemptive</a
            >
            (preview).
          </p>

          <h2>Thực dụng</h2>
          <ul>
            <li>Một signal/ctx cho cả request.</li>
            <li>Driver không support signal ≈ không cancel được chỗ đó.</li>
            <li>Retry chỉ khi còn budget và lần trước đã dừng.</li>
            <li>Metric <code>aborted</code> tách 5xx.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Hết giờ mà không cancel = vẫn trả CPU/pool cho việc không ai chờ.</strong>
          </p>
`
);

add(
  "retry-what-when.html",
  "Retry cái gì, bỏ cái gì — khi retry tự đấm mình",
  "Transient vs permanent. Khi retry tạo storm, double, đốt budget.",
  "Retry cái gì, bỏ cái gì — và khi retry tự đấm mình",
  6,
  `          <p>
            <a href="/articles/retry-backoff-jitter.html">Backoff + jitter</a>
            = <em>cách</em> retry. Bài này:
            <strong>có nên</strong>, và khi bấm là tự hại.
          </p>

          <h2>Thường được retry</h2>
          <ul>
            <li>Network blip, 429/502/503/504 (nếu safe).</li>
            <li>GET; POST có
              <a href="/articles/idempotency.html">idempotency key</a>.</li>
          </ul>

          <h2>Thường không</h2>
          <ul>
            <li>400, 401/403 (trừ flow token), 404 “không có”.</li>
            <li>Side-effect không idempotent.</li>
            <li>Hết
              <a href="/articles/timeout-budget.html">budget</a>.</li>
          </ul>

          <h2>Unknown / timeout</h2>
          <p>
            Có thể đã commit. Retry không key =
            double. Coi
            <a href="/articles/stale-missing-wrong.html">uncertain</a>.
          </p>

          <h2>Tự đấm mình</h2>
          <pre><code>Storm          — herd sau blip (thiếu jitter/breaker)
Amplification  — mỗi hop nhân N retry
Poison loop    — permanent fail chặn partition
Budget burn    — user cút vẫn retry
Deploy herd    — mọi instance đập cùng lúc</code></pre>
          <p>
            Ghép
            <a href="/articles/circuit-breaker.html">breaker</a>,
            <a href="/articles/load-shedding.html">load shedding</a> (preview).
          </p>

          <h2>Checklist</h2>
          <ol>
            <li>Transient hay permanent?</li>
            <li>Idempotent?</li>
            <li>Còn budget?</li>
            <li>Breaker / Retry-After?</li>
            <li>Fan-out × attempts có nổ?</li>
          </ol>

          <h2>Một câu</h2>
          <p>
            <strong>Retry là vũ khí — có hướng nổ ngược.</strong>
            Backoff chỉ là nhịp cò.
          </p>
`
);

add(
  "unblock.html",
  "Unblock — đừng đóng băng cả hàng vì một message",
  "Ưu tiên nhả lane: DLQ, resend, error channel. Trade-off vs correctness.",
  "Unblock — đừng đóng băng cả hàng vì một message hỏng",
  6,
  `          <p>
            Poison message, retry mãi, lag tăng — lane block. Business đói event
            không phải vì broker chết.
          </p>
          <p>
            <a href="/articles/async-recovery-playbook.html">Playbook</a> đã có
            strategy; đây đặt tên mục tiêu:
            <strong>unblock</strong>.
          </p>

          <h2>Theo purpose</h2>
          <ul>
            <li>
              <strong>Write:</strong> block consumer ≈ block hành động → unblock
              thường gấp.
            </li>
            <li>
              <strong>Read:</strong> block có thể tránh wrong; skip dễ
              <a href="/articles/stale-missing-wrong.html">missing</a>.
            </li>
            <li>
              <strong>Shared:</strong> resend cẩn —
              <a href="/articles/resend-shared-channel.html">resend shared</a>.
            </li>
          </ul>

          <h2>Công cụ</h2>
          <pre><code>Delayed resend / error channel / DLQ → nhả main lane
Ignore → unblock mạnh, correctness tùy purpose
Release → giữ order, dễ kẹt nếu mãi fail</code></pre>

          <h2>Khi correctness &gt; unblock</h2>
          <p>Ledger, số dư, projection bắt buộc order per-key.</p>

          <h2>Thực dụng</h2>
          <ul>
            <li>Max retry + DLQ trên write worker.</li>
            <li>Metric: oldest age, lag, DLQ rate.</li>
            <li>
              Sau unblock:
              <a href="/articles/dlq-triage.html">DLQ triage</a> (preview).
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Đôi khi đúng là nhả hàng, không phải “xử lý bằng được” trên
            lane chính.</strong>
          </p>
`
);

add(
  "inflight-inventory.html",
  "In-flight = inventory — mỗi việc bay là một khoản nợ",
  "Đếm Promise/job dang dở: RAM, pool, socket. Bound inventory.",
  "In-flight = inventory — mỗi việc đang bay là một khoản nợ",
  5,
  `          <p>
            Mỗi việc dang dở giữ vốn: RAM, FD, DB connection, timer. Đó là
            <strong>in-flight inventory</strong>.
          </p>

          <h2>Map</h2>
          <ul>
            <li>
              Không trần →
              <a href="/articles/unbounded-inflight.html">unbounded</a>.
            </li>
            <li>
              Trần số →
              <a href="/articles/promise-all-batch-vs-pool.html">pool</a>.
            </li>
            <li>
              Đầy thì tín hiệu ngược →
              <a href="/articles/backpressure.html">backpressure</a>.
            </li>
            <li>
              Unit rẻ vẫn 1 SKU →
              <a href="/articles/coroutine.html">coroutine</a>.
            </li>
          </ul>

          <h2>Đếm</h2>
          <pre><code>in_flight_requests | in_flight_jobs
db_pool_active     | queue_unacked
event_loop_delay   // proxy nợ trên 1 thread</code></pre>

          <h2>Ngân sách</h2>
          <p>
            Trần theo tài nguyên hẹp (hay DB pool / memory), không theo “CPU
            rảnh”. Full →
            <a href="/articles/load-shedding.html">shed</a> /
            backpressure.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>In-flight là hàng giữ vốn — không bound là phá sản im lặng.</strong>
          </p>
`
);

// ——— P1 ———
add(
  "order-budget.html",
  "Order budget — order tuyệt đối đắt",
  "Anh em timeout budget: order global vs per-key vs đủ business.",
  "Order budget — order tuyệt đối đắt, order “đủ dùng” rẻ hơn",
  5,
  `          <p>
            <a href="/articles/timeout-budget.html">Timeout budget</a> giới hạn
            <em>thời gian</em>.
            <strong>Order budget</strong> giới hạn
            <em>yêu cầu thứ tự</em> bạn thật sự trả tiền (latency, dual,
            complexity).
          </p>

          <h2>Các mức</h2>
          <pre><code>Global total order  — rất đắt, hiếm cần
Per-key / partition — đủ hầu hết business
Best-effort order   — chấp nhận xáo nhẹ
No order            — parallel workers thoải mái</code></pre>

          <h2>Trả giá order chặt</h2>
          <ul>
            <li>Một poison chặn cả key/partition (cần
              <a href="/articles/unblock.html">unblock</a> có chủ đích).</li>
            <li>Khó scale consumer (hot key).</li>
            <li>Resend / multi-writer dễ phá order → wrong.</li>
          </ul>

          <h2>Thực dụng</h2>
          <p>
            Hỏi product: “sai thứ tự hai event A,B có vỡ money/path không?”
            Không → đừng mua global order. Có per aggregate id → partition key.
            Xem
            <a href="/articles/partition-key-ordering.html">partition key</a>
            (preview).
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Order là ngân sách — chi đúng chỗ business vỡ, đừng mặc định
            tuyệt đối.</strong>
          </p>
`
);

add(
  "exactly-once-pragmatic.html",
  "Exactly-once thực dụng — at-least + idempotent",
  "Broker “exactly-once” vẫn cần handler idempotent. At-least-once là mặc định đời thực.",
  "Exactly-once thực dụng — at-least-once + idempotent handler",
  5,
  `          <p>
            Marketing: exactly-once delivery. Đời thực: mạng + crash →
            <strong>at-least-once</strong> (hoặc at-most + mất message).
            “Một lần tác dụng” ≈
            <strong>at-least-once + idempotent xử lý</strong>
            (+ đôi khi transactional outbox).
          </p>

          <h2>Ba lớp hay nhầm</h2>
          <pre><code>Delivery   — message tới consumer mấy lần?
Processing — handler chạy mấy lần?
Effect     — side-effect (charge, row) xuất hiện mấy lần?</code></pre>
          <p>
            Bạn care
            <em>effect</em>. EOS broker không miễn
            <a href="/articles/idempotency.html">idempotent handler</a>.
          </p>

          <h2>Công thức thực dụng</h2>
          <ol>
            <li>Giả định redelivery (lease, visibility, at-least).</li>
            <li>Idempotency key / dedup store / unique constraint.</li>
            <li>
              Publish an toàn:
              <a href="/articles/outbox-inbox.html">outbox</a>.
            </li>
            <li>
              Unknown timeout:
              <a href="/articles/retry-what-when.html">đừng retry mù</a>.
            </li>
          </ol>

          <h2>Một câu</h2>
          <p>
            <strong>Exactly-once effect = at-least-once delivery × idempotent
            processing.</strong>
            Chữ trên slide broker không thay unique constraint.
          </p>
`
);

add(
  "ignore-when-ok.html",
  "Ignore khi nào là đúng — bỏ message không phải lúc nào cũng sai",
  "Ack/skip có chủ đích: metric, best-effort, sample. Cấm mặc định trên read bắt buộc đủ.",
  "Ignore khi nào là đúng — bỏ message không phải lúc nào cũng sai",
  5,
  `          <p>
            <a href="/articles/async-recovery-playbook.html">Matrix</a> có
            Ignore. Nghe xấu — đôi khi là
            <strong>sản phẩm đúng</strong>.
          </p>

          <h2>Ignore hợp lý</h2>
          <ul>
            <li>Best-effort notify (push, email marketing) — mất vài cái OK.</li>
            <li>Metric / sample / debug event.</li>
            <li>Duplicate đã dedup (ack bỏ bản sau).</li>
            <li>Schema unknown + policy “drop + metric” (hiếm, có alert).</li>
          </ul>

          <h2>Ignore nguy hiểm</h2>
          <ul>
            <li>
              Read/projection phải đủ → missing —
              <a href="/articles/stale-missing-wrong.html">stale/missing/wrong</a>.
            </li>
            <li>Write money path — mất action.</li>
            <li>Shared log — app khác cần event đó.</li>
          </ul>

          <h2>Làm đúng nếu ignore</h2>
          <p>
            Metric + alert tỷ lệ drop; document SLA; không dùng ignore để “cho
            lẹ” khi chưa phân loại lỗi.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Ignore là decision sản phẩm, không phải catch rỗng.</strong>
          </p>
`
);

add(
  "idempotency-key-scope.html",
  "Idempotency key — sai scope là retry vẫn nhân đôi",
  "Scope key: user vs request vs operation vs time window. TTL và store.",
  "Idempotency key — sai scope là retry vẫn nhân đôi",
  5,
  `          <p>
            <a href="/articles/idempotency.html">Idempotency</a> đã nói vì sao.
            Bài này: <strong>key phạm vi nào</strong>.
          </p>

          <h2>Scope hay dùng</h2>
          <pre><code>request_id     — một lần bấm “Thanh toán” (client gen)
operation_id   — logic “refund order 123” (server)
user+action+day— “check-in mỗi ngày một lần”
row version    — optimistic concurrency</code></pre>

          <h2>Sai scope</h2>
          <ul>
            <li>Key theo <code>user_id</code> only → mọi thao tác sau bị chặn nhầm.</li>
            <li>Key mới mỗi retry phía client → double charge.</li>
            <li>TTL ngắn hơn cửa sổ retry hợp lệ → mất dedup đúng lúc cần.</li>
            <li>Store chỉ in-memory một pod → multi-instance thủng.</li>
          </ul>

          <h2>Thực dụng</h2>
          <ul>
            <li>Client gửi key; server persist kết quả theo key.</li>
            <li>Cùng key + cùng body → trả response cũ; khác body → 409.</li>
            <li>TTL ≥ max retry window + clock skew.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Idempotency không phải flag — là key + scope + store + TTL.</strong>
          </p>
`
);

add(
  "dlq-triage.html",
  "DLQ triage — cất rồi làm gì, redrive thế nào",
  "DLQ không phải xóa. Phân loại, fix, redrive, alert. Tránh hố đen.",
  "DLQ triage — cất rồi làm gì, redrive thế nào",
  5,
  `          <p>
            <a href="/articles/poison-dlq.html">Poison / DLQ</a> =
            <a href="/articles/unblock.html">unblock</a> lane. Nếu không ai
            đọc DLQ = xóa có thêm bước.
          </p>

          <h2>Triage</h2>
          <ol>
            <li>Alert khi DLQ &gt; 0 hoặc rate tăng.</li>
            <li>Phân loại: bug code / schema / data xấu / dependency.</li>
            <li>Fix code hoặc sửa payload.</li>
            <li>Redrive có bound + idempotent.</li>
            <li>Drop có document nếu ignore hợp lệ.</li>
          </ol>

          <h2>Redrive cẩn</h2>
          <ul>
            <li>Không redrive cả đống vào giờ peak không backpressure.</li>
            <li>Order / shared: xem purpose trước khi nhét lại main topic.</li>
            <li>Metric success sau redrive.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>DLQ là phòng chờ có chủ — không phải thùng rác.</strong>
          </p>
`
);

add(
  "rate-limit-vs-pool.html",
  "Rate limit vs pool — trần thời gian khác trần số bay",
  "Pool = max in-flight. Rate limit = max starts / time. Khác đơn vị, dùng khác chỗ.",
  "Rate limit vs pool — trần theo thời gian khác trần số đang bay",
  5,
  `          <p>
            <a href="/articles/promise-all-batch-vs-pool.html">Pool</a>: tối đa
            <strong>K đang chạy</strong>.
            <strong>Rate limit</strong>: tối đa
            <strong>N bắt đầu / giây</strong> (token bucket, leaky bucket).
          </p>

          <h2>Khác nhau</h2>
          <pre><code>Pool        — inventory in-flight (RAM, connection)
Rate limit  — tốc độ vào (QPS, fair share, API quota)
Cả hai      — thường cần: K bay + N/sec start</code></pre>

          <h2>Ví dụ</h2>
          <ul>
            <li>Pool 10, mỗi job 60s → ~10/phút throughput nếu full.</li>
            <li>Rate 100/s, pool 10 → hàng đợi start, không nổ 100 parallel.</li>
            <li>Chỉ rate không pool → vẫn spike in-flight nếu job chậm.</li>
          </ul>

          <h2>Nối</h2>
          <p>
            <a href="/articles/inflight-inventory.html">Inventory</a>,
            <a href="/articles/backpressure.html">backpressure</a>,
            <a href="/articles/load-shedding.html">load shedding</a>.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Pool = bao nhiêu đang ôm; rate = bao nhanh được bốc thêm.</strong>
          </p>
`
);

add(
  "bulkhead.html",
  "Bulkhead — một dependency chết không kéo sập cả process",
  "Cô lập pool/thread/semaphore theo dependency. Cạnh circuit breaker.",
  "Bulkhead — một dependency chết không được kéo sập cả process",
  5,
  `          <p>
            Tàu: vách ngăn (bulkhead) — một khoang ngập không chìm cả tàu.
            Service: pool riêng cho DB / payment / search — một bên chậm không
            nuốt hết thread.
          </p>

          <h2>Làm gì</h2>
          <pre><code>// ethread/semaphore riêng
paymentPool = 20
searchPool  = 10
// search treo 30s không chiếm slot payment</code></pre>

          <h2>Với breaker</h2>
          <ul>
            <li>
              <a href="/articles/circuit-breaker.html">Breaker</a>: ngừng gọi khi
              đỏ.
            </li>
            <li>Bulkhead: dù chưa đỏ, không cho một dependency ôm hết resource.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Cô lập tài nguyên theo dependency — chậm một khoang, không chìm cả process.</strong>
          </p>
`
);

add(
  "load-shedding.html",
  "Load shedding — đôi khi đúng là từ chối request",
  "Dual backpressure: shed có chủ đích (503, drop) khi inventory đầy.",
  "Load shedding — đôi khi đúng là từ chối request",
  5,
  `          <p>
            <a href="/articles/backpressure.html">Backpressure</a>: làm chậm
            producer. Khi không kiểm soát được client (internet),
            <strong>load shedding</strong> = từ chối có chủ đích để giữ phần
            còn lại sống.
          </p>

          <h2>Dấu hiệu cần shed</h2>
          <ul>
            <li>In-flight / queue / CPU / heap quá ngưỡng.</li>
            <li>Latency đã vỡ SLA — nhận thêm chỉ làm mọi người chậm.</li>
          </ul>

          <h2>Cách</h2>
          <pre><code>503 + Retry-After
Từ chối low-priority / batch trước
Shed ở edge (gateway) trước khi vào app</code></pre>

          <h2>Một câu</h2>
          <p>
            <strong>Giữ 80% request tốt còn hơn 100% request cùng chậm chết.</strong>
          </p>
`
);

add(
  "consumer-lag.html",
  "Consumer lag — offset trễ là tín hiệu sản phẩm",
  "Lag không chỉ ops: stale view, SLA, backpressure. Khi scale, khi alert.",
  "Consumer lag — offset trễ là tín hiệu sản phẩm, không chỉ ops",
  5,
  `          <p>
            Lag = production đi trước consumer. Trên read side: user thấy
            <a href="/articles/stale-missing-wrong.html">stale</a>.
          </p>

          <h2>Đọc lag</h2>
          <ul>
            <li>Lag tăng + CPU consumer max → scale / optimize handler.</li>
            <li>Lag tăng + consumer rảnh → kẹt block / poison —
              <a href="/articles/unblock.html">unblock</a>.</li>
            <li>Lag ổn định ≠ 0 — có thể SLA stale chấp nhận được.</li>
          </ul>

          <h2>Product</h2>
          <p>
            Dashboard “gần real-time” cần budget lag (phút/giây) — nói với
            product, không chỉ page on-call.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Lag là độ trễ sự thật của view — metric sản phẩm đội lốt ops.</strong>
          </p>
`
);

add(
  "shared-channel-multitenant.html",
  "Shared channel multi-tenant — recover đụng group khác",
  "Shared log: một consumer recover có thể double/side-effect app khác.",
  "Shared channel multi-tenant — recover của bạn đụng group khác",
  5,
  `          <p>
            <a href="/articles/write-vs-read-channel.html">Shared channel</a>:
            nhiều app / group đọc cùng log.
            <a href="/articles/resend-shared-channel.html">Resend</a> lên shared
            = sự kiện mới cho <em>mọi</em> subscriber.
          </p>

          <h2>Hệ quả</h2>
          <ul>
            <li>Group A retry bằng publish lại → group B xử lý lần 2.</li>
            <li>Unblock A bằng resend shared có thể phá B.</li>
          </ul>

          <h2>An toàn hơn</h2>
          <ul>
            <li>Error / retry channel <strong>private</strong>.</li>
            <li>Idempotent mọi consumer trên shared.</li>
            <li>DLQ private; không nhét lại shared nếu chỉ một group cần.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Shared log là multi-tenant failure domain — recover local đừng
            thành broadcast.</strong>
          </p>
`
);

// ——— P2 ———
add(
  "event-loop.html",
  "Event loop — ai resume sau await",
  "Loop xếp callback/microtask. Sync block = kẹt cả nhà. Nối coroutine.",
  "Event loop — ai resume sau await, ai bị kẹt khi sync",
  5,
  `          <p>
            <a href="/articles/coroutine.html">Coroutine</a> suspend; ai
            <strong>resume</strong>? Trên Node/browser/asyncio: event loop.
          </p>

          <h2>Vòng lặp ý</h2>
          <pre><code>while (true) {
  // 1) timers đã đến hạn
  // 2) I/O completion
  // 3) microtasks (Promise jobs) — JS: hết microtask trước macrotask tiếp
  // 4) lặp
}</code></pre>

          <h2>Hệ quả</h2>
          <ul>
            <li>Sync CPU / sync I/O trên loop = không ai resume — “concurrent” chết.</li>
            <li>
              <code>await</code> nhường loop; code sau await là continuation xếp hàng.
            </li>
            <li>
              Offload CPU:
              <a href="/articles/thread-pool-offload.html">thread pool</a> (preview).
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Event loop là điều phối viên resume — đừng bắt nó đứng chờ
            sync.</strong>
          </p>
`
);

add(
  "cooperative-vs-preemptive.html",
  "Cooperative vs preemptive — nhường vs bị cắt",
  "Await/yield vs OS preempt thread. Khi nào cooperative không đủ.",
  "Cooperative vs preemptive — nhường chỗ vs bị OS cắt",
  5,
  `          <p>
            <strong>Cooperative:</strong> task tự nhường (await, yield).
            <strong>Preemptive:</strong> scheduler/OS cắt giữa chừng (thread).
          </p>

          <h2>Hệ quả</h2>
          <ul>
            <li>
              Cooperative + CPU nặng không await = starvation (loop kẹt).
            </li>
            <li>
              Preemptive: fair hơn CPU, đắt context switch; shared memory race.
            </li>
            <li>
              Go goroutine: model coroutine + runtime có preemption safepoint.
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Async cooperative chỉ công bằng khi mọi người thật sự nhường.</strong>
          </p>
`
);

add(
  "thread-pool-offload.html",
  "Thread pool / offload — CPU và sync I/O",
  "Khi nào đưa việc ra worker pool. Trần pool = trần blocking in-flight.",
  "Thread pool / offload — khi nào đưa CPU và sync I/O ra ngoài loop",
  5,
  `          <p>
            Event loop giỏi I/O non-block. CPU hash lớn, driver sync →
            <strong>offload</strong> sang thread/process pool.
          </p>

          <h2>Lưu ý</h2>
          <ul>
            <li>Pool size = max blocking in-flight (inventory).</li>
            <li>
              Offload không biến O(n²) thành nhanh — chỉ khỏi kẹt loop.
            </li>
            <li>
              Parallel thật: multi-core + nhiều worker —
              <a href="/articles/data-vs-task-parallelism.html">data/task</a>.
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Offload cứu loop; pool size vẫn là ngân sách.</strong>
          </p>
`
);

add(
  "connection-pool-exhaustion.html",
  "Connection pool hết chỗ — chậm mà CPU rảnh",
  "Chờ connection DB: latency cao, CPU idle. Pool size, timeout, leak.",
  "Connection pool hết chỗ — chậm mà CPU vẫn rảnh",
  5,
  `          <p>
            Triệu chứng: p99 cao, CPU thấp, thread/async chờ
            <code>getConnection</code>. Không phải “thiếu CPU” —
            <strong>hết inventory connection</strong>.
          </p>

          <h2>Nguyên nhân</h2>
          <ul>
            <li>Pool nhỏ hơn concurrency handler.</li>
            <li>Query chậm giữ connection lâu.</li>
            <li>Leak: mượn không trả.</li>
            <li>
              Retry chồng thêm checkout —
              <a href="/articles/retry-what-when.html">retry</a>.
            </li>
          </ul>

          <h2>Làm</h2>
          <ul>
            <li>Metric: wait time, active/idle, timeout acquire.</li>
            <li>
              Align pool với
              <a href="/articles/inflight-inventory.html">in-flight</a> app.
            </li>
            <li>Statement timeout; cancel khi budget hết.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Chậm + CPU rảnh → nghi pool/lock, đừng chỉ scale CPU.</strong>
          </p>
`
);

add(
  "heap-rss-cgroup.html",
  "Heap vs RSS vs cgroup — OOM vì đâu",
  "Heap V8/JVM ≠ RSS. Cgroup limit kill. Chọn số đúng khi debug OOM.",
  "Heap vs RSS vs cgroup — OOMKill vì con số nào",
  5,
  `          <p>
            <a href="/articles/linux-vss-rss-uss.html">VSS/RSS/USS</a> +
            <a href="/articles/garbage-collector.html">GC</a>. Thêm:
            heap process vs RSS vs
            <strong>cgroup memory limit</strong> (container).
          </p>

          <h2>Chọn số</h2>
          <pre><code>Heap        — object runtime (GC)
RSS         — RAM process (kể native, stack, mapped)
cgroup max  — trần K8s/Docker — vượt → OOMKill</code></pre>

          <h2>Bẫy</h2>
          <ul>
            <li>Heap “ổn” nhưng RSS + native buffer nổ.</li>
            <li>Limit container &lt; RSS thực tế dưới load.</li>
            <li>
              Unbounded in-flight nâng cả heap và RSS —
              <a href="/articles/unbounded-inflight.html">unbounded</a>.
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>OOM là câu chuyện limit + RSS, không chỉ “heap graph đẹp”.</strong>
          </p>
`
);

add(
  "cache-stampede.html",
  "Cache stampede — TTL về 0 mọi người bắn cùng lúc",
  "Expired key, N request regenerate. Single-flight, soft TTL, jitter expiry.",
  "Cache stampede — TTL về 0, mọi người bắn cùng một lúc",
  5,
  `          <p>
            Hot key hết hạn → hàng nghìn request miss → cùng query DB.
            Gần
            <a href="/articles/retry-backoff-jitter.html">thundering herd</a>
            đội lốt cache.
          </p>

          <h2>Chữa</h2>
          <ul>
            <li>
              <a href="/articles/reuse-promise.html">Single-flight</a> /
              request coalescing per key.
            </li>
            <li>Soft TTL: phục vụ stale ngắn + revalidate một path.</li>
            <li>Jitter expiry (mỗi key ± random).</li>
            <li>Probabilistic early refresh.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Miss đồng loạt đắt hơn miss lẻ — coalesce trước khi đập DB.</strong>
          </p>
`
);

// ——— P3 ———
add(
  "dual-write-vs-outbox.html",
  "Dual-write vs outbox — ảo tưởng atomic qua hai hệ",
  "Ghi DB + publish không atomic. Outbox là đường chuẩn; dual-write triệu chứng.",
  "Dual-write vs outbox — ảo tưởng atomic qua hai hệ",
  5,
  `          <p>
            <code>db.save(); bus.publish();</code> — process chết giữa hai dòng
            → mất event hoặc ngược lại.
            <a href="/articles/outbox-inbox.html">Outbox</a> ghi event cùng
            transaction DB rồi publisher đọc outbox.
          </p>

          <h2>Vì sao vẫn dual-write</h2>
          <p>Nhanh, “tạm”. Triệu chứng: missing event, support “đơn có / mail không”.</p>

          <h2>Một câu</h2>
          <p>
            <strong>Hai hệ = không atomic — outbox (hoặc tương đương), đừng tin
            hai dòng code.</strong>
          </p>
`
);

add(
  "breaker-failure-modes.html",
  "Breaker failure modes — flap, half-open, fail-open/closed",
  "Dual circuit breaker: flapping, half-open storm, chọn fail-open vs closed.",
  "Breaker failure modes — flap, half-open herd, fail-open vs closed",
  5,
  `          <p>
            <a href="/articles/circuit-breaker.html">Breaker</a> bảo vệ. Tự nó
            cũng hỏng kiểu:
          </p>
          <ul>
            <li><strong>Flapping</strong> — mở/đóng liên tục, metric nhiễu.</li>
            <li><strong>Half-open storm</strong> — nhiều request thử cùng lúc.</li>
            <li><strong>Fail-closed</strong> — dependency đỏ → từ chối (an toàn, mất availability).</li>
            <li><strong>Fail-open</strong> — vẫn cho qua khi breaker lỗi (availability, rủi ro).</li>
          </ul>

          <h2>Thực dụng</h2>
          <p>
            Một probe half-open; hysteresis; phân biệt auth (thường fail-closed)
            vs feature phụ (có thể degrade).
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Breaker cũng cần thiết kế failure — không chỉ threshold lỗi.</strong>
          </p>
`
);

add(
  "hedging.html",
  "Hedging — bắn thêm request lấy cái về trước",
  "Speculative retry / hedge tail latency. Cần idempotent; tăng load.",
  "Hedging — bắn thêm một request để lấy cái về trước",
  5,
  `          <p>
            p99 bị một replica chậm. Hedge: sau X ms gửi request thứ hai, lấy
            response đầu. Giảm tail; <strong>tăng fan-out</strong>.
          </p>

          <h2>Điều kiện</h2>
          <ul>
            <li>Idempotent hoặc an toàn dual.</li>
            <li>Budget còn; cancel request thua.</li>
            <li>Không hedge khi dependency đã đỏ (breaker).</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Hedge mua latency bằng capacity — chỉ khi effect an toàn.</strong>
          </p>
`
);

add(
  "partition-key-ordering.html",
  "Partition key & ordering — thứ tự trong một key",
  "Order per partition key. Hot key, chọn key, trade-off scale.",
  "Partition key & ordering — thứ tự trong một key",
  5,
  `          <p>
            Stream/Kafka: order mạnh trong partition.
            <a href="/articles/order-budget.html">Order budget</a> per aggregate
            → chọn key = id nghiệp vụ (orderId, accountId).
          </p>

          <h2>Bẫy</h2>
          <ul>
            <li>Key quá thô (một key) → không scale.</li>
            <li>Key quá mịn → mất order cần có.</li>
            <li>Hot key (celebrity account) → bottleneck.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Key là chỗ bạn mua order — chọn theo đơn vị business, không theo thói quen.</strong>
          </p>
`
);

add(
  "competing-consumers.html",
  "Competing consumers — N worker một hàng",
  "N worker tranh message: scale throughput, không đảm bảo order global.",
  "Competing consumers — N worker một queue",
  4,
  `          <p>
            Nhiều consumer cùng group/queue: mỗi message một worker.
            Scale
            <a href="/articles/bullmq.html">worker</a>; order global không còn
            (trừ một consumer hoặc partition key).
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Competing consumers = thêm tay làm — đổi lấy order toàn cục.</strong>
          </p>
`
);

add(
  "fanout-vs-work-queue.html",
  "Fan-out vs work queue — mọi người nghe hay một người làm",
  "Pub/sub fan-out vs queue việc. Purpose khác → recover khác.",
  "Fan-out vs work queue — mọi service đều nghe hay chỉ một worker làm",
  4,
  `          <p>
            <strong>Work queue:</strong> một việc, một worker (competing).
            <strong>Fan-out / pub-sub:</strong> một event, nhiều subscriber độc lập.
          </p>
          <p>
            Shared fan-out → cẩn resend
            (<a href="/articles/shared-channel-multitenant.html">multi-tenant</a>).
            Work queue → lease, DLQ cổ điển.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Một việc vs một tin broadcast — đừng dùng chung một recovery.</strong>
          </p>
`
);

add(
  "saga-compensation.html",
  "Saga / compensation — reverse nghiệp vụ không phải undo DB",
  "Multi-step side-effect: choreography/orchestration + bù trừ, không 2PC.",
  "Saga / compensation — dài hạn side-effect và bù trừ",
  5,
  `          <p>
            Đặt chỗ = giữ phòng + charge + mail. Fail giữa chừng không
            rollback distributed cổ điển — dùng
            <strong>saga</strong>: bước bù (cancel phòng, refund).
          </p>

          <h2>Gắn series</h2>
          <ul>
            <li>Mỗi bước idempotent.</li>
            <li>
              Outbox cho event bước.
            </li>
            <li>Compensation ≠ DELETE — là nghiệp vụ ngược.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Saga chấp nhận tạm sai để tiến — bù trừ có chủ đích, không ảo 2PC.</strong>
          </p>
`
);

add(
  "tracing-timeout-budget.html",
  "Tracing — đọc timeout budget trên span",
  "Một request nhiều span: deadline còn bao nhiêu, span nào ngốn.",
  "Tracing — nhìn timeout budget trên chuỗi span",
  4,
  `          <p>
            <a href="/articles/timeout-budget.html">Budget</a> trên giấy.
            Trace cho thấy hop nào ăn hết ms, chỗ nào retry, chỗ nào không
            cancel.
          </p>

          <h2>Thực dụng</h2>
          <ul>
            <li>Attribute: deadline_remaining_ms, attempt, outcome=aborted.</li>
            <li>So parent duration vs sum children — gap = queue/pool wait.</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Trace là kính hiển vi của budget — không thay budget trong code.</strong>
          </p>
`
);

add(
  "slo-error-budget.html",
  "SLO / error budget — retry có ngốn reliability không",
  "Retry và shed ảnh hưởng success rate. Error budget = quyền fail.",
  "SLO / error budget — retry và shed có đốt reliability không",
  5,
  `          <p>
            SLO: mục tiêu tin cậy (vd. 99.9% thành công).
            <strong>Error budget</strong>: phần được fail.
            Retry storm / nhận quá tải đốt budget nhanh.
          </p>

          <h2>Nối series</h2>
          <ul>
            <li>
              Retry tăng load — có thể làm hỏng SLO chung.
            </li>
            <li>
              Load shedding: fail có kiểm soát để giữ budget dài hạn.
            </li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Mỗi retry là đánh cược error budget — không free.</strong>
          </p>
`
);

add(
  "parallel-workers-vs-assembly-line.html",
  "Parallel workers vs assembly line — làm trọn job hay chia stage",
  "Jenkov-style: worker full job vs pipeline stage + non-block I/O.",
  "Parallel workers vs assembly line — làm trọn job hay chia stage khi chờ I/O",
  6,
  `          <p>
            Hai model tổ chức (cùng tinh thần tutorial concurrency models):
          </p>
          <pre><code>Parallel workers — mỗi worker làm trọn một job (pool request)
Assembly line    — mỗi stage một phần; ranh giới hay là I/O non-block</code></pre>

          <h2>Map series</h2>
          <ul>
            <li>
              Workers: pool, thread/virtual thread, competing consumers.
            </li>
            <li>
              Assembly: event loop, coroutine, channel giữa stage, reactive.
            </li>
            <li>
              Shared state workers → race; separate state + message → dễ reason.
            </li>
            <li>
              Order: workers nondeterministic; line có thể log/order.
            </li>
          </ul>

          <h2>Chọn</h2>
          <p>
            Job độc lập + I/O block kiểu thread → workers.
            Nhiều chờ, ít thread, pipeline → assembly + non-block.
            Hệ thật hay lai.
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Làm trọn song song, hay chia đoạn khi chờ — khác topology, khác chỗ kẹt.</strong>
          </p>
`
);

add(
  "structured-concurrency.html",
  "Structured concurrency — task con sống chết theo cha",
  "Scope: không leak fire-and-forget. Cancel lan. Nối cancellation.",
  "Structured concurrency — task con sống chết theo scope cha",
  5,
  `          <p>
            Fire-and-forget <code>void run()</code> → task mồ côi, lỗi nuốt,
            cancel không lan.
            <strong>Structured concurrency</strong>: mọi task con trong scope;
            scope thoát = con xong hoặc bị cancel.
          </p>

          <h2>Nối</h2>
          <ul>
            <li>
              <a href="/articles/cancellation.html">Cancellation</a> theo cây.
            </li>
            <li>
              Không leak
              <a href="/articles/inflight-inventory.html">in-flight</a>.
            </li>
            <li>Kotlin coroutine scope, Java structured concurrency API, nursery…</li>
          </ul>

          <h2>Một câu</h2>
          <p>
            <strong>Task có cha có mẹ — đừng đẻ async mồ côi.</strong>
          </p>
`
);

add(
  "slow-service-playbook.html",
  "Playbook service chậm — 10 phút hỏi gì",
  "Checklist triệu chứng chậm: deal/do, pool, budget, dependency, lag, RAM.",
  "Playbook “service chậm” — checklist khoảng 10 phút",
  5,
  `          <p>
            Bổ sung
            <a href="/articles/symptom-map.html">hub triệu chứng</a>: thứ tự
            hỏi khi p99/latency kêu.
          </p>

          <h2>10 phút</h2>
          <ol>
            <li>Chậm từ khi nào / deploy / traffic?</li>
            <li>CPU cao hay rảnh? (rảnh → chờ pool/I/O/lock)</li>
            <li>In-flight / queue / DB pool active?</li>
            <li>Dependency latency / error rate / breaker?</li>
            <li>Timeout / retry có phóng đại không?</li>
            <li>GC / RSS / cgroup?</li>
            <li>Chỉ vài endpoint hay toàn cục?</li>
            <li>Trace: span nào ngốn? queue wait?</li>
            <li>Hot key / thundering / stampede?</li>
            <li>Shed / scale / rollback — quyết định tạm?</li>
          </ol>

          <h2>Đọc nhanh</h2>
          <p>
            <a href="/articles/timeout-budget.html">Budget</a> ·
            <a href="/articles/connection-pool-exhaustion.html">DB pool</a> ·
            <a href="/articles/retry-what-when.html">Retry</a> ·
            <a href="/articles/inflight-inventory.html">In-flight</a>
          </p>

          <h2>Một câu</h2>
          <p>
            <strong>Chậm là triệu chứng — hỏi chờ gì, ôm gì, đốt budget ở đâu trước khi scale mù.</strong>
          </p>
`
);

// write all
for (const [name, content] of files) {
  fs.writeFileSync(path.join(dir, name), content, "utf8");
  console.log("wrote", name);
}
console.log("total", files.length);
