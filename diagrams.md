# Conference Hub System Diagrams

This document contains comprehensive Mermaid diagrams for the Conference Hub system as described in Chapter 3: Methodology and System Design.

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI[UI Components<br/>Shadcn UI, Custom Components]
        Pages[Page Components<br/>Next.js App Router]
    end
    
    subgraph "Application Layer"
        AppLogic[Application Logic<br/>Context, Hooks, Utils]
        StateManagement[State Management<br/>React Context, TanStack Query]
    end
    
    subgraph "Data Access Layer"
        DataAccess[Data Access Layer<br/>API Clients, Data Utils]
        APIRoutes[API Routes<br/>Next.js API Endpoints]
    end
    
    subgraph "Backend Services"
        SupabaseClient[Supabase Client]
        SupabaseServices[Supabase Services<br/>Auth, Database, Storage]
    end
    
    subgraph "External Services"
        Paystack[Paystack<br/>Payment Processing]
        EmailService[SMTP Email Service<br/>Notifications]
    end
    
    UI --> Pages
    Pages --> AppLogic
    AppLogic --> StateManagement
    StateManagement --> DataAccess
    DataAccess --> APIRoutes
    APIRoutes --> SupabaseClient
    SupabaseClient --> SupabaseServices
    APIRoutes --> Paystack
    APIRoutes --> EmailService
    
    classDef clientLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef appLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dataLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef backendLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef externalLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class UI,Pages clientLayer
    class AppLogic,StateManagement appLayer
    class DataAccess,APIRoutes dataLayer
    class SupabaseClient,SupabaseServices backendLayer
    class Paystack,EmailService externalLayer
```

## 2. Primary Use Case Diagram

```mermaid
graph TB
    subgraph "Actors"
        RegularUser[👤 Regular User]
        FacilityManager[👨‍💼 Facility Manager]
        Admin[👨‍💻 Admin]
    end
    
    subgraph "Authentication Use Cases"
        Login[🔐 Login]
        Register[📝 Register]
        ResetPassword[🔄 Reset Password]
    end
    
    subgraph "User Use Cases"
        BrowseRooms[🏢 Browse Rooms]
        CreateBooking[📅 Create Booking]
        MakePayment[💳 Make Payment]
        ManageBookings[📋 Manage My Bookings]
        CheckIn[✅ Check-in to Room]
        ViewProfile[👤 View Profile]
    end
    
    subgraph "Facility Manager Use Cases"
        ManageBookings_FM[📊 Manage Bookings]
        ApproveReject[✅❌ Approve/Reject Bookings]
        ManageRooms[🏠 Manage Rooms]
        SendNotifications[📧 Send Notifications]
        ViewReports_FM[📈 View Reports]
    end
    
    subgraph "Admin Use Cases"
        ManageUsers[👥 Manage Users]
        ManageFacilities[🏢 Manage Facilities]
        ViewReports_Admin[📊 View System Reports]
        SystemConfig[⚙️ System Configuration]
        ManagePayments[💰 Manage Payments]
    end
    
    RegularUser --> Login
    RegularUser --> Register
    RegularUser --> BrowseRooms
    RegularUser --> CreateBooking
    RegularUser --> MakePayment
    RegularUser --> ManageBookings
    RegularUser --> CheckIn
    RegularUser --> ViewProfile
    
    FacilityManager --> Login
    FacilityManager --> ManageBookings_FM
    FacilityManager --> ApproveReject
    FacilityManager --> ManageRooms
    FacilityManager --> SendNotifications
    FacilityManager --> ViewReports_FM
    
    Admin --> Login
    Admin --> ManageUsers
    Admin --> ManageFacilities
    Admin --> ViewReports_Admin
    Admin --> SystemConfig
    Admin --> ManagePayments
    
    CreateBooking -.-> MakePayment
    ApproveReject -.-> SendNotifications
    
    classDef actor fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef authUseCase fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef userUseCase fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef managerUseCase fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef adminUseCase fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class RegularUser,FacilityManager,Admin actor
    class Login,Register,ResetPassword authUseCase
    class BrowseRooms,CreateBooking,MakePayment,ManageBookings,CheckIn,ViewProfile userUseCase
    class ManageBookings_FM,ApproveReject,ManageRooms,SendNotifications,ViewReports_FM managerUseCase
    class ManageUsers,ManageFacilities,ViewReports_Admin,SystemConfig,ManagePayments adminUseCase
```

## 3. Core Domain Class Diagram

```mermaid
classDiagram
    class User {
        -string id
        -string name
        -string email
        -UserRole role
        -string department
        -string position
        -string phone
        -UserStatus status
        -Date createdAt
        -Date lastLogin
        +login() boolean
        +logout() void
        +updateProfile() boolean
        +resetPassword() boolean
    }

    class Facility {
        -string id
        -string name
        -string description
        -string location
        -string managerId
        -Date createdAt
        -Date updatedAt
        +addRoom() boolean
        +removeRoom() boolean
        +updateDetails() boolean
    }

    class Room {
        -string id
        -string name
        -string facilityId
        -string location
        -number capacity
        -string[] features
        -RoomStatus status
        -number hourlyRate
        -string currency
        -string image
        -string description
        +checkAvailability() boolean
        +updateStatus() boolean
        +calculateCost() number
    }

    class Booking {
        -string id
        -string userId
        -string roomId
        -string title
        -string description
        -Date startTime
        -Date endTime
        -number attendees
        -BookingStatus status
        -string[] resources
        -PaymentStatus paymentStatus
        -Date createdAt
        +create() boolean
        +update() boolean
        +cancel() boolean
        +checkIn() boolean
        +approve() boolean
        +reject() boolean
    }

    class Payment {
        -string id
        -string bookingId
        -number amount
        -string currency
        -PaymentStatus status
        -string paystackRef
        -string paymentMethod
        -Date paidAt
        +initialize() string
        +verify() boolean
        +refund() boolean
    }

    class Resource {
        -string id
        -string name
        -ResourceType type
        -string description
        -boolean isAvailable
        -string[] roomIds
        +assignToRoom() boolean
        +removeFromRoom() boolean
        +checkAvailability() boolean
    }

    User ||--o{ Booking : creates
    Facility ||--o{ Room : contains
    Room ||--o{ Booking : hosts
    Booking ||--o| Payment : requires
    Room }o--o{ Resource : uses
    User ||--|| Facility : manages

    classDef entityClass fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef valueClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class User,Facility,Room,Booking entityClass
    class Payment,Resource valueClass
```

## 4. Database Schema (ERD)

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string name
        string role
        string department
        string position
        string phone
        string status
        timestamp created_at
        timestamp last_login
    }

    facilities {
        uuid id PK
        string name
        text description
        string location
        uuid manager_id FK
        timestamp created_at
        timestamp updated_at
    }

    rooms {
        uuid id PK
        string name
        uuid facility_id FK
        string location
        integer capacity
        text features
        string status
        decimal hourly_rate
        string currency
        string image_url
        text description
        timestamp created_at
        timestamp updated_at
    }

    bookings {
        uuid id PK
        uuid user_id FK
        uuid room_id FK
        string title
        text description
        timestamp start_time
        timestamp end_time
        integer attendees
        string status
        text resources
        string payment_status
        text rejection_reason
        timestamp created_at
        timestamp updated_at
    }

    payments {
        uuid id PK
        uuid booking_id FK
        decimal amount
        string currency
        string status
        string paystack_reference
        string payment_method
        json metadata
        timestamp paid_at
        timestamp created_at
    }

    resources {
        uuid id PK
        string name
        string type
        text description
        boolean is_available
        uuid facility_id FK
        timestamp created_at
        timestamp updated_at
    }

    room_resources {
        uuid room_id FK
        uuid resource_id FK
    }

    users ||--o{ bookings : creates
    users ||--|| facilities : manages
    facilities ||--o{ rooms : contains
    facilities ||--o{ resources : owns
    rooms ||--o{ bookings : hosts
    bookings ||--o| payments : requires
    rooms }o--o{ resources : uses
```

## 5. Booking Creation Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant BookingModal
    participant API
    participant Database
    participant PaymentService
    participant EmailService

    User->>BookingModal: Select Room & Time
    BookingModal->>BookingModal: Validate Input

    User->>BookingModal: Submit Booking
    BookingModal->>API: POST /api/bookings

    API->>Database: Check Conflicts
    Database-->>API: Availability Status

    alt No Conflicts
        API->>Database: Create Booking
        Database-->>API: Booking Created

        alt Payment Required
            API->>PaymentService: Initialize Payment
            PaymentService-->>API: Payment URL
            API-->>BookingModal: Payment URL
            BookingModal-->>User: Redirect to Payment

            User->>PaymentService: Complete Payment
            PaymentService->>API: Payment Webhook
            API->>PaymentService: Verify Payment
            PaymentService-->>API: Payment Confirmed

            API->>Database: Update Booking Status
            Database-->>API: Status Updated
        end

        API->>EmailService: Send Confirmation Email
        EmailService-->>API: Email Sent

        API-->>BookingModal: Success Response
        BookingModal-->>User: Show Success Message

    else Conflicts Found
        API-->>BookingModal: Conflict Error
        BookingModal-->>User: Show Conflict Message
    end
```

## 6. User Authentication Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant AuthContext
    participant API
    participant Supabase
    participant Database

    User->>LoginForm: Enter Credentials
    LoginForm->>AuthContext: Submit Login

    AuthContext->>API: POST /api/auth/login
    API->>Supabase: signInWithPassword

    Supabase->>Database: Validate Credentials
    Database-->>Supabase: User Data

    alt Valid Credentials
        Supabase-->>API: Session & Token
        API-->>AuthContext: Auth Response
        AuthContext->>AuthContext: Update User State
        AuthContext-->>LoginForm: Login Success
        LoginForm-->>User: Redirect to Dashboard

    else Invalid Credentials
        Supabase-->>API: Auth Error
        API-->>AuthContext: Error Response
        AuthContext-->>LoginForm: Login Failed
        LoginForm-->>User: Show Error Message
    end
```

## 7. Booking Approval Activity Diagram

```mermaid
flowchart TD
    Start([Start: New Booking Request]) --> CheckAvailability{Check Room Availability}

    CheckAvailability -->|Available| CheckPayment{Payment Required?}
    CheckAvailability -->|Not Available| AutoReject[Auto-Reject Booking]

    CheckPayment -->|Yes| CheckPaymentStatus{Payment Completed?}
    CheckPayment -->|No| NotifyManager[Notify Facility Manager]

    CheckPaymentStatus -->|Yes| NotifyManager
    CheckPaymentStatus -->|No| PendingPayment[Set Status: Payment Pending]

    PendingPayment --> WaitPayment[Wait for Payment]
    WaitPayment --> PaymentReceived{Payment Received?}
    PaymentReceived -->|Yes| NotifyManager
    PaymentReceived -->|No| PaymentTimeout[Payment Timeout]
    PaymentTimeout --> AutoReject

    NotifyManager --> ManagerReview{Manager Review}

    ManagerReview -->|Approved| UpdateStatusConfirmed[Update Status: Confirmed]
    ManagerReview -->|Rejected| UpdateStatusRejected[Update Status: Rejected]
    ManagerReview -->|Needs Modification| RequestModification[Request Modification]

    UpdateStatusConfirmed --> SendConfirmationEmail[Send Confirmation Email]
    UpdateStatusRejected --> ProcessRefund{Refund Required?}
    RequestModification --> NotifyUser[Notify User of Required Changes]

    ProcessRefund -->|Yes| InitiateRefund[Initiate Refund Process]
    ProcessRefund -->|No| SendRejectionEmail[Send Rejection Email]

    InitiateRefund --> SendRejectionEmail
    AutoReject --> SendRejectionEmail

    SendConfirmationEmail --> End([End: Booking Processed])
    SendRejectionEmail --> End
    NotifyUser --> End

    classDef startEnd fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef rejection fill:#ffebee,stroke:#c62828,stroke-width:2px

    class Start,End startEnd
    class CheckAvailability,CheckPayment,CheckPaymentStatus,PaymentReceived,ManagerReview,ProcessRefund decision
    class NotifyManager,UpdateStatusConfirmed,SendConfirmationEmail,RequestModification,NotifyUser,InitiateRefund process
    class AutoReject,UpdateStatusRejected,SendRejectionEmail,PaymentTimeout rejection
```

## 8. Booking Status State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending : Create Booking

    Pending --> PaymentPending : Payment Required
    Pending --> Approved : No Payment Required
    Pending --> Cancelled : User Cancellation

    PaymentPending --> Paid : Payment Completed
    PaymentPending --> Cancelled : Payment Failed/Timeout

    Paid --> Approved : Auto-Approval
    Paid --> Cancelled : Manager Rejection

    Approved --> Confirmed : Manager Approval
    Approved --> Cancelled : Manager Rejection
    Approved --> PaymentPending : Payment Required Later

    Confirmed --> InProgress : Meeting Started
    Confirmed --> Cancelled : Cancellation

    InProgress --> Completed : Meeting Ended
    InProgress --> Cancelled : Early Termination

    Cancelled --> [*]
    Completed --> [*]

    note right of Pending
        Initial state when
        booking is created
    end note

    note right of PaymentPending
        Waiting for payment
        completion
    end note

    note right of Confirmed
        Ready for meeting
        to begin
    end note

    note right of InProgress
        Meeting is currently
        active
    end note
```

## 9. Component Architecture Diagram

```mermaid
graph TB
    subgraph "Layout Components"
        MainLayout[MainLayout<br/>Header, Footer, Navigation]
        AdminLayout[AdminLayout<br/>Admin Sidebar, Content Area]
        DisplayLayout[DisplayLayout<br/>Room Status Display]
    end

    subgraph "Feature Components"
        BookingModal[BookingCreationModal<br/>Complete Booking Workflow]
        RoomStatus[RoomStatusIndicator<br/>Real-time Status Display]
        PaymentProcessor[PaymentProcessor<br/>Payment Integration]
        UserManagement[UserManagement<br/>Admin User Operations]
        FacilityManagement[FacilityManagement<br/>Facility Operations]
    end

    subgraph "UI Components (Shadcn UI)"
        Forms[Form Components<br/>Input, Select, Textarea]
        DataDisplay[Data Display<br/>Table, Card, List]
        Interactive[Interactive<br/>Modal, Dropdown, Calendar]
        Feedback[Feedback<br/>Toast, Alert, Progress]
    end

    subgraph "Context Providers"
        AuthContext[AuthContext<br/>User Authentication State]
        ThemeContext[ThemeContext<br/>Theme Management]
        NotificationContext[NotificationContext<br/>App Notifications]
    end

    subgraph "Custom Hooks"
        useAuth[useAuth<br/>Authentication Logic]
        useBookings[useBookings<br/>Booking Operations]
        useRealtime[useRealtime<br/>Real-time Updates]
        usePayment[usePayment<br/>Payment Processing]
    end

    MainLayout --> BookingModal
    MainLayout --> RoomStatus
    AdminLayout --> UserManagement
    AdminLayout --> FacilityManagement
    DisplayLayout --> RoomStatus

    BookingModal --> PaymentProcessor
    BookingModal --> Forms
    BookingModal --> Interactive

    UserManagement --> DataDisplay
    UserManagement --> Forms
    FacilityManagement --> DataDisplay
    FacilityManagement --> Forms

    BookingModal --> useBookings
    BookingModal --> usePayment
    RoomStatus --> useRealtime
    UserManagement --> useAuth

    useAuth --> AuthContext
    useBookings --> AuthContext
    useRealtime --> NotificationContext

    Interactive --> Feedback
    Forms --> Feedback

    classDef layoutComp fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef featureComp fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef uiComp fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef contextComp fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef hookComp fill:#ffebee,stroke:#c62828,stroke-width:2px

    class MainLayout,AdminLayout,DisplayLayout layoutComp
    class BookingModal,RoomStatus,PaymentProcessor,UserManagement,FacilityManagement featureComp
    class Forms,DataDisplay,Interactive,Feedback uiComp
    class AuthContext,ThemeContext,NotificationContext contextComp
    class useAuth,useBookings,useRealtime,usePayment hookComp
```

## 10. Integration Architecture Diagram

```mermaid
graph TB
    subgraph "Conference Hub Application"
        Frontend[Next.js Frontend<br/>React Components]
        APILayer[API Layer<br/>Next.js API Routes]
        DataLayer[Data Access Layer<br/>Supabase Client]
    end

    subgraph "Supabase Backend"
        Auth[Supabase Auth<br/>JWT Authentication]
        Database[PostgreSQL Database<br/>Row Level Security]
        Realtime[Supabase Realtime<br/>WebSocket Subscriptions]
        Storage[Supabase Storage<br/>File Management]
    end

    subgraph "External Services"
        PaystackAPI[Paystack API<br/>Payment Processing]
        PaystackWebhook[Paystack Webhooks<br/>Payment Notifications]
        EmailSMTP[SMTP Email Service<br/>Notification Delivery]
        EmailTemplates[Email Templates<br/>HTML Email Content]
    end

    subgraph "Third-party Integrations"
        CalendarAPI[Calendar APIs<br/>Google, Outlook]
        NotificationServices[Push Notifications<br/>Web Push, Mobile]
    end

    Frontend --> APILayer
    APILayer --> DataLayer
    DataLayer --> Auth
    DataLayer --> Database
    DataLayer --> Realtime
    DataLayer --> Storage

    APILayer --> PaystackAPI
    PaystackWebhook --> APILayer
    APILayer --> EmailSMTP
    EmailSMTP --> EmailTemplates

    APILayer -.-> CalendarAPI
    APILayer -.-> NotificationServices

    Frontend --> Realtime

    classDef appLayer fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef supabaseLayer fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef externalLayer fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef futureLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5

    class Frontend,APILayer,DataLayer appLayer
    class Auth,Database,Realtime,Storage supabaseLayer
    class PaystackAPI,PaystackWebhook,EmailSMTP,EmailTemplates externalLayer
    class CalendarAPI,NotificationServices futureLayer
```

## 11. Deployment Architecture Diagram

```mermaid
graph TB
    subgraph "Development Environment"
        DevLocal[Local Development<br/>Next.js Dev Server]
        DevDB[Local Supabase<br/>Docker Container]
    end

    subgraph "Staging Environment"
        StagingApp[Vercel Staging<br/>Preview Deployments]
        StagingDB[Supabase Staging<br/>Staging Database]
    end

    subgraph "Production Environment"
        ProdApp[Vercel Production<br/>Global CDN]
        ProdDB[Supabase Production<br/>Production Database]
        ProdMonitoring[Monitoring<br/>Vercel Analytics]
    end

    subgraph "External Production Services"
        PaystackProd[Paystack Production<br/>Live Payment Processing]
        EmailProd[Production SMTP<br/>Email Delivery Service]
        DNSProvider[DNS Provider<br/>Domain Management]
    end

    subgraph "CI/CD Pipeline"
        GitRepo[Git Repository<br/>Source Code]
        GitHubActions[GitHub Actions<br/>Automated Testing]
        VercelDeploy[Vercel Deployment<br/>Automatic Builds]
    end

    DevLocal --> DevDB

    GitRepo --> GitHubActions
    GitHubActions --> VercelDeploy
    VercelDeploy --> StagingApp
    VercelDeploy --> ProdApp

    StagingApp --> StagingDB
    ProdApp --> ProdDB
    ProdApp --> ProdMonitoring

    ProdApp --> PaystackProd
    ProdApp --> EmailProd
    DNSProvider --> ProdApp

    classDef devEnv fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef stagingEnv fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef prodEnv fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef externalProd fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef cicd fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class DevLocal,DevDB devEnv
    class StagingApp,StagingDB stagingEnv
    class ProdApp,ProdDB,ProdMonitoring prodEnv
    class PaystackProd,EmailProd,DNSProvider externalProd
    class GitRepo,GitHubActions,VercelDeploy cicd
```

## 12. Security Architecture Diagram

```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS/TLS<br/>Encrypted Communication]
        CSP[Content Security Policy<br/>XSS Protection]
        CORS[CORS Configuration<br/>Cross-Origin Protection]
    end

    subgraph "Authentication Layer"
        JWT[JWT Tokens<br/>Secure Session Management]
        PasswordHash[Password Hashing<br/>bcrypt Encryption]
        MFA[Multi-Factor Auth<br/>Optional 2FA]
    end

    subgraph "Authorization Layer"
        RBAC[Role-Based Access Control<br/>User, Manager, Admin]
        RLS[Row Level Security<br/>Database Policies]
        APIAuth[API Authentication<br/>Token Validation]
    end

    subgraph "Data Protection"
        InputValidation[Input Validation<br/>Client & Server Side]
        SQLInjection[SQL Injection Prevention<br/>Parameterized Queries]
        DataEncryption[Data Encryption<br/>At Rest & In Transit]
    end

    subgraph "Monitoring & Auditing"
        AuditLogs[Audit Logging<br/>User Actions Tracking]
        SecurityMonitoring[Security Monitoring<br/>Threat Detection]
        ErrorHandling[Secure Error Handling<br/>No Data Exposure]
    end

    HTTPS --> JWT
    CSP --> InputValidation
    CORS --> APIAuth

    JWT --> RBAC
    PasswordHash --> RBAC
    MFA --> RBAC

    RBAC --> RLS
    APIAuth --> RLS

    InputValidation --> SQLInjection
    SQLInjection --> DataEncryption

    RBAC --> AuditLogs
    APIAuth --> SecurityMonitoring
    DataEncryption --> ErrorHandling

    classDef clientSec fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef authSec fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef authzSec fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef dataSec fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef monitorSec fill:#ffebee,stroke:#c62828,stroke-width:2px

    class HTTPS,CSP,CORS clientSec
    class JWT,PasswordHash,MFA authSec
    class RBAC,RLS,APIAuth authzSec
    class InputValidation,SQLInjection,DataEncryption dataSec
    class AuditLogs,SecurityMonitoring,ErrorHandling monitorSec
```

## 13. Real-time Communication Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        WebApp[Web Application<br/>React Components]
        TabletDisplay[Tablet Display<br/>Room Status Screen]
        MobileApp[Mobile App<br/>Future Implementation]
    end

    subgraph "Real-time Layer"
        RealtimeManager[Realtime Manager<br/>Connection Orchestrator]
        WebSocketClient[WebSocket Client<br/>Supabase Realtime]
        PollingFallback[Polling Fallback<br/>HTTP Polling]
    end

    subgraph "Supabase Realtime"
        RealtimeServer[Supabase Realtime Server<br/>WebSocket Server]
        DatabaseTriggers[Database Triggers<br/>Change Detection]
        RealtimeChannels[Realtime Channels<br/>Topic-based Routing]
    end

    subgraph "Database Events"
        BookingChanges[Booking Changes<br/>INSERT, UPDATE, DELETE]
        RoomStatusChanges[Room Status Changes<br/>Availability Updates]
        UserPresence[User Presence<br/>Check-in/Check-out]
    end

    WebApp --> RealtimeManager
    TabletDisplay --> RealtimeManager
    MobileApp -.-> RealtimeManager

    RealtimeManager --> WebSocketClient
    RealtimeManager --> PollingFallback

    WebSocketClient --> RealtimeServer
    PollingFallback -.-> RealtimeServer

    RealtimeServer --> DatabaseTriggers
    RealtimeServer --> RealtimeChannels

    DatabaseTriggers --> BookingChanges
    DatabaseTriggers --> RoomStatusChanges
    DatabaseTriggers --> UserPresence

    BookingChanges --> RealtimeChannels
    RoomStatusChanges --> RealtimeChannels
    UserPresence --> RealtimeChannels

    classDef clientApp fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef realtimeLayer fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef supabaseRealtime fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef dbEvents fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef future fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5

    class WebApp,TabletDisplay clientApp
    class MobileApp future
    class RealtimeManager,WebSocketClient,PollingFallback realtimeLayer
    class RealtimeServer,DatabaseTriggers,RealtimeChannels supabaseRealtime
    class BookingChanges,RoomStatusChanges,UserPresence dbEvents
```

---

*This document contains comprehensive Mermaid diagrams representing all aspects of the Conference Hub system architecture as described in Chapter 3. Each diagram uses professional academic styling with consistent color schemes and clear visual hierarchy suitable for technical documentation.*
