Ok, mình summary lại toàn bộ flow hôm nay theo kiểu **đọc lại để ngẫm** nhé.

# Clean Architecture + DDD: Từ Entity đến Consistency

## 1. Entity là gì?

Entity là object đại diện cho một **business concept có identity**.

Ví dụ:

```text
Customer
Order
Product
Payment
```

Entity không chỉ là object chứa data:

```ts
class Order {
  id;
  status;
  total;
}
```

Mà nên chứa behavior và business rule liên quan trực tiếp đến chính nó:

```ts
order.cancel();
order.addItem();
order.applyPromotion();
```

Ví dụ:

```text
Order đã PAID thì không được sửa item
Order đã SHIPPED thì customer không được cancel
Discount không được lớn hơn Order total
```

Đây là những rule thuộc về `Order`.

> **Entity = object biết cách bảo vệ trạng thái và business rule của chính nó.**

---

# 2. Use Case là gì?

Use Case đại diện cho một **hành động / business scenario của hệ thống**.

Ví dụ:

```text
CreateOrderUseCase
CancelOrderUseCase
CheckoutOrderUseCase
ApplyPromotionToOrderUseCase
ForceCancelOrderUseCase
```

Use Case không nhất thiết chứa business rule của Entity.

Nó chịu trách nhiệm **điều phối flow**:

```text
Load data
↓
Check permission
↓
Gọi Entity behavior
↓
Save
↓
Gọi external service
↓
Publish event
```

Ví dụ:

```text
CancelOrderUseCase

Load Order
↓
Check Customer permission
↓
order.cancel()
↓
Save Order
↓
Refund
↓
Send notification
```

> **Use Case = biết quy trình cần làm gì.**
> **Entity = biết hành động đó có hợp lệ với trạng thái của nó hay không.**

---

# 3. Một hành động có thể tồn tại ở cả Use Case và Entity

Ví dụ:

```text
CancelOrderUseCase
```

và:

```ts
order.cancel();
```

Hai cái này không trùng trách nhiệm.

### Use Case

```text
Ai đang cancel?
Có quyền không?
Cần load gì?
Sau cancel cần refund không?
Có cần gửi notification không?
```

### Entity

```text
Order hiện tại có được cancel không?
Sau khi cancel status là gì?
Có invariant nào phải đảm bảo không?
```

Nên:

```text
CancelOrderUseCase
        ↓
order.cancel()
```

là hoàn toàn bình thường.

---

# 4. Khi có ngoại lệ business scenario

Ví dụ:

### Customer bình thường

```text
CancelOrderUseCase
→ order.cancelByCustomer()
```

### Admin phát hiện customer cheat

```text
ForceCancelOrderUseCase
→ order.forceCancel(reason)
```

Đây là hai Use Case khác nhau vì workflow khác nhau.

Nhưng Entity vẫn quản lý state transition:

```text
Customer chỉ được cancel:
PENDING → CANCELLED

Admin có thể force cancel:
PAID → FORCE_CANCELLED
SHIPPED → FORCE_CANCELLED

Nhưng:
COMPLETED → không được
```

Điểm quan trọng:

> **Force không có nghĩa là bypass Entity.**

Không nên:

```sql
UPDATE orders
SET status = 'CANCELLED'
```

một cách trực tiếp chỉ vì Admin có quyền.

Business vẫn cần định nghĩa:

> Admin được force đến mức nào?

---

# 5. Một Use Case có thể dùng nhiều Entity

Ví dụ:

```text
CreateOrderUseCase

Customer
Product
Order
```

Hoặc:

```text
CancelOrderUseCase

Order
Payment
Inventory
Customer
```

Use Case có thể:

```text
Load Order
↓
order.cancel()

Load Customer
↓
customer.removePoints()

Load Inventory
↓
inventory.restore()

Payment
↓
refund()
```

Đây là việc bình thường.

Có thể nhớ:

> **Entity tự bảo vệ mình.**
> **Use Case điều phối nhiều Entity.**

---

# 6. Aggregate là gì?

Không phải Entity nào cũng nên bị thao tác trực tiếp từ bên ngoài.

Ví dụ:

```text
Order
├── OrderItem
├── OrderItem
└── OrderItem
```

`OrderItem` có thể là Entity vì nó có identity riêng.

Nhưng nếu ai cũng sửa trực tiếp:

```ts
orderItem.changeQuantity(100);
```

thì có thể phá rule của `Order`.

Ví dụ:

```text
Order đã PAID
→ không được sửa item

Order total phải luôn bằng tổng items
```

Vì vậy ta tạo boundary:

```text
Order Aggregate

Order ← Aggregate Root
│
├── OrderItem
├── OrderItem
└── OrderItem
```

Bên ngoài thao tác:

```ts
order.changeItemQuantity(itemId, 100);
```

chứ không:

```ts
orderItem.changeQuantity(100);
```

---

# 7. Aggregate Root

Aggregate Root là **entry point để thao tác Aggregate**.

Ví dụ:

```text
Order Aggregate

        Order
          │
    ┌─────┴─────┐
    ▼           ▼
OrderItem   OrderItem
```

Use Case:

```text
Use Case
   ↓
Order Repository
   ↓
Order Aggregate Root
   ↓
OrderItem
```

Thông thường Repository cũng đi với Aggregate Root:

```text
OrderRepository       ✅
CustomerRepository    ✅
ProductRepository     ✅

OrderItemRepository   thường không cần
```

---

# 8. Aggregate không nên quá lớn

Sai:

```text
Order Aggregate

Order
├── Customer
├── Product
├── Payment
├── Inventory
├── Promotion
└── Shipping
```

Vì chỉ cần load Order là kéo cả thế giới lên.

Thường sẽ tách:

```text
Order Aggregate
Product Aggregate
Customer Aggregate
Payment Aggregate
Inventory Aggregate
```

Và liên kết bằng ID:

```ts
class Order {
  customerId;
  paymentId;
}
```

---

# 9. Aggregate boundary không có nghĩa là không được dùng Transaction chung

Đây là một điểm quan trọng.

Ví dụ:

```text
Order Aggregate
Payment Aggregate
Inventory Aggregate
```

Hoàn toàn có thể:

```text
BEGIN TRANSACTION

order.cancel()
payment.markRefunded()
inventory.restore()

SAVE

COMMIT
```

Nếu tất cả ở cùng database và transaction fail:

```text
ROLLBACK
```

thì vẫn atomic.

Vậy:

> **Aggregate boundary ≠ Database transaction boundary**

Aggregate nói về:

> Domain consistency nên được quản lý ở đâu.

Transaction nói về:

> Persistence có commit hoặc rollback cùng nhau được không.

---

# 10. Vấn đề bắt đầu khi có External System

Ví dụ:

```text
Cancel Order
↓
Order → MySQL
↓
Refund → Stripe
```

Bạn không thể:

```text
BEGIN TRANSACTION

Update MySQL
Call Stripe Refund

ROLLBACK
```

rồi mong Stripe refund tự rollback.

Nếu:

```text
Stripe Refund = SUCCESS
```

nhưng sau đó:

```text
MySQL = FAILED
```

thì bạn gặp distributed consistency problem.

---

# 11. Các chiến lược xử lý consistency

## A. Database Transaction

Dùng khi tất cả resource nằm trong phạm vi transaction mà bạn kiểm soát.

```text
Transaction
├── Order
├── Payment
└── Inventory
```

```text
Success → COMMIT
Fail    → ROLLBACK
```

Đơn giản nhất.

---

## B. Domain Event

Entity phát ra một business fact:

```text
order.cancel()

↓
OrderCancelled
```

Entity không cần biết:

```text
Payment
Inventory
Email
Notification
```

Nó chỉ nói:

> Order đã bị cancel.

Các phần khác có thể reaction lại.

```text
OrderCancelled
├── Refund handler
├── Restore inventory handler
└── Send notification handler
```

---

## C. Integration Event

Khi event đi ra ngoài boundary/service.

```text
Order Service
      ↓
OrderCancelledIntegrationEvent
      ↓
Message Broker
      ├── Payment Service
      ├── Inventory Service
      └── Notification Service
```

Các service xử lý độc lập.

---

## D. Outbox Pattern

Giải quyết vấn đề:

```text
Order đã save thành công

NHƯNG

Publish event thất bại
```

Thay vì:

```text
Save Order
↓
Publish Event
```

ta làm:

```text
DB Transaction

Save Order
+
Save Outbox Event

COMMIT
```

Sau đó Worker:

```text
Outbox
↓
Publish Event
↓
Consumer xử lý
```

Nếu broker chết:

```text
Event vẫn còn trong DB
↓
Retry
```

Outbox đảm bảo:

> **Business state đã commit thì event cũng không bị mất.**

---

## E. Saga / Process Manager

Dùng khi workflow nhiều bước, đặc biệt là distributed system.

```text
Cancel Order Saga

1. Cancel Order
2. Refund Payment
3. Restore Inventory
4. Restore Coupon
5. Adjust Reward Point
6. Complete
```

Nếu bước giữa fail:

```text
Cancel Order        ✅
Refund              ✅
Restore Inventory   ❌
```

Saga có thể:

```text
Retry
↓
Compensation
↓
Manual intervention
```

Saga không phải:

```text
Database rollback
```

Mà là:

> **Thực hiện action bù trừ để đưa business về trạng thái hợp lý.**

---

## F. Eventual Consistency

Đây không hẳn là một pattern cụ thể.

Nó là việc chấp nhận rằng trong một khoảng thời gian:

```text
Order      = CANCELLED
Payment    = REFUND_PENDING
Inventory  = RESERVED
```

Sau một lúc:

```text
Order      = CANCELLED
Payment    = REFUNDED
Inventory  = RESTORED
```

Tức là:

```text
T0
Order cancelled

T1
Payment refunded

T2
Inventory restored
```

Trong `T0 → T2`, data chưa consistent hoàn toàn.

Nhưng hệ thống đảm bảo:

> Eventually, các phần sẽ đạt trạng thái consistent.

---

# 12. Các kỹ thuật này không loại trừ nhau

Một flow thực tế có thể là:

```text
CancelOrderUseCase
        ↓
order.cancel()
        ↓
┌─────────────────────────────┐
│       DB Transaction        │
│                             │
│ Save Order                  │
│ Save OrderCancelled Event   │
│ vào Outbox                  │
└──────────────┬──────────────┘
               ↓
             COMMIT
               ↓
         Outbox Worker
               ↓
     Publish Integration Event
               ↓
      ┌────────┼────────┐
      ▼        ▼        ▼
   Payment  Inventory  Email
```

Ở đây:

```text
Transaction
→ đảm bảo Order + Outbox cùng commit

Domain Event
→ biểu diễn fact "OrderCancelled"

Outbox
→ đảm bảo event không mất

Integration Event
→ gửi event sang service khác

Eventual Consistency
→ các service update sau, không cùng lúc

Saga
→ quản lý flow nếu nhiều bước phức tạp
```

---

# 13. Lựa chọn consistency strategy ảnh hưởng đến Clean Architecture

Đây là câu cuối cùng rất quan trọng.

Cùng một business action:

```text
Cancel Order
```

Domain có thể vẫn:

```ts
order.cancel();
```

Nhưng Application/Infrastructure khác nhau.

### Version 1 — Transaction

```text
CancelOrderUseCase
↓
Order.cancel()
↓
Payment.refund()
↓
Inventory.restore()
↓
Commit
```

### Version 2 — Event + Outbox

```text
CancelOrderUseCase
↓
Order.cancel()
↓
Save Order + Outbox
↓
Commit
↓
Worker
↓
Refund / Restore
```

### Version 3 — Saga

```text
CancelOrderUseCase
↓
Start CancelOrderSaga
↓
Cancel
↓
Refund
↓
Restore Inventory
↓
Complete / Retry / Compensation
```

---

# 14. Điều hay của Clean Architecture

Nếu tách đúng thì phần thay đổi nhiều nhất là:

```text
Infrastructure
↑
Application
↑
Domain
```

Tức là:

### Domain

Khá stable:

```ts
order.cancel();
order.applyPromotion();
order.addItem();
```

### Application

Thay đổi theo workflow:

```text
Transaction
Event-driven
Saga
```

### Infrastructure

Thay đổi nhiều nhất:

```text
MySQL
Stripe
RabbitMQ
Kafka
Outbox Worker
```

---

# Mental Model cuối cùng

Nếu chỉ cần nhớ một sơ đồ:

```text
                    USER / API
                        │
                        ▼
                    USE CASE
              "Quy trình làm gì?"
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Order        Customer       Payment
      Aggregate     Aggregate     Aggregate
          │
          ▼
       Entity
   "Có hợp lệ không?"
          │
          ▼
     Domain Event
   "Chuyện gì đã xảy ra?"
          │
          ▼
   ┌─────────────────────────┐
   │ Consistency Strategy    │
   │                         │
   │ Transaction             │
   │ Event                   │
   │ Outbox                  │
   │ Saga                    │
   │ Eventual Consistency    │
   └─────────────────────────┘
          │
          ▼
      Infrastructure
   DB / Queue / API / Worker
```

## Một câu chốt cho cả bài hôm nay

> **Entity bảo vệ business rule của chính nó.**
> **Aggregate bảo vệ consistency của một nhóm object liên quan chặt chẽ.**
> **Use Case điều phối business scenario giữa các Aggregate.**
> **Transaction/Event/Outbox/Saga quyết định cách hệ thống giữ consistency khi workflow trở nên phức tạp.**
> **Clean Architecture giúp Domain ít bị ảnh hưởng khi cách persistence và communication thay đổi.**

Theo mình, chỗ đáng ngẫm nhất của bài này là:

> **Không phải cứ “business logic” là nhét vào Entity. Và cũng không phải cứ “nhiều Entity” là sai Clean Architecture.**

Câu hỏi quan trọng hơn luôn là:

```text
Rule này thuộc về object nào?
Rule này cần consistency ngay lập tức hay không?
Workflow này có cần điều phối nhiều Aggregate không?
External system có thể rollback cùng mình không?
Nếu fail giữa chừng thì business muốn retry, compensate hay manual xử lý?
```

Trả lời được mấy câu đó thì tự nhiên bạn sẽ biết nên dùng **Entity method, Use Case, Transaction, Event, Outbox hay Saga**.
