# 喔壳 Demo 领域术语

喔壳 Demo 以数字员工组织用户的业务操作，以应用承载业务管理员的业务配置。本文统一产品用语；开发规则见 `docs/Demo开发规范.md`。

## 产品通用语言

**数字员工**：面向某类业务职责的工作入口，包含对话和同级业务菜单，例如会议助理、销售助理、汇报助理。_避免_：把数字员工等同于聊天机器人或应用设置页。

**对话**：数字员工的第一个菜单和默认入口，用户以自然语言提出业务需求，并查看、确认业务操作结果。_避免_：仅提供与业务数据无关的问答。

**业务菜单**：与对话并列、面向日常业务对象和工作结果的操作入口，例如我的会议、客户、商机、历史报告。_避免_：将全局业务规则配置混入普通业务列表。

**应用**：某一业务领域的配置入口，由业务管理员维护该业务的资源、规则、模板和权限，例如会议应用。_避免_：用“应用”泛指数字员工下的全部业务操作页面。

**业务配置**：影响业务如何运行的可复用设置，例如会议室、预约规则、会议纪要模板。_避免_：把一条会议预约或一份会议纪要称为配置。

**业务记录**：用户办理业务时产生或维护的具体对象，例如一次会议预约、一个商机、一份汇报。_避免_：应用配置。

**业务用户**：通过数字员工及其业务菜单办理日常工作的使用者。_避免_：默认拥有业务配置管理权限。

**业务管理员**：有权维护某个应用的业务配置的角色；同一人也可以是该业务的使用者。_避免_：将业务管理员与平台管理员视为同一职责。

**个人设置**：只影响当前用户的偏好，例如个人通知偏好；不等同于影响整个业务的应用配置。_避免_：把团队共享规则放入个人设置。

## 项目管理语言

This context defines the language used by WorkoPilot's AI PMO and Project Assistant to manage project baselines, execution evidence, and human decisions.

## Language

**Project**: An approved or pending body of work with a named owner, delivery boundary, and planned time window. _Avoid_: Portfolio item, work package

**Initiation**: The process that turns source materials and a proposed plan into an approved project baseline. _Avoid_: Project creation, setup

**Delivery Project PMO**: The delivery-department instance of the reusable Project PMO capability. The instance owns initiation, delivery governance, and risk intervention; department-specific templates and vocabulary are configuration, not separate page implementations. _Avoid_: Hard-coding all PMO capability to one department

**Stage**: A time-bounded portion of a project with dependencies, entry criteria, and a completion gate. A stage is structural and is not a project status. _Avoid_: Phase status, Objective

**Objective (O)**: A qualitative outcome pursued within a project stage and owned by one accountable person with optional collaborators. _Avoid_: Stage, task

**Key Result (KR)**: A verifiable result that demonstrates progress toward an Objective; it is either a Deliverable KR or a Metric KR. _Avoid_: Activity, to-do

**Deliverable KR**: A Key Result satisfied by producing and accepting a named artifact. _Avoid_: Attachment, task output

**Metric KR**: A Key Result satisfied by reaching a measurable target value by a due date. _Avoid_: KPI when referring to a project result

**Deliverable**: The named artifact required by a Deliverable KR, such as a report, signed document, release, or acceptance record. _Avoid_: Evidence

**Evidence**: A traceable record used to verify a KR, including a weekly-report entry, file, approval, code change, or customer confirmation. _Avoid_: Deliverable

**Project Baseline**: The approved set of stage windows, dependencies, Objectives, KRs, owners, and acceptance gates against which execution is evaluated. _Avoid_: Plan draft

**Policy Source**: An approved internal rule document used as traceable evidence when creating or changing reusable project standards. _Avoid_: Project contract, template file

**Project Template**: A versioned reusable standard derived from one or more Policy Sources and used to create a proposed Project Baseline during Initiation. _Avoid_: Policy, project plan, prompt

**Project Charter**: The human-approved initiation record that defines a project's delivery boundary, milestones, RACI, resources, acceptance rules, and change mechanism. _Avoid_: Project brief, template

**Planned Project Work**: Work reported against an existing Project Objective, KR, or Deliverable and evaluated against the Project Baseline. _Avoid_: Routine task

**Unplanned Work**: Non-project work recorded separately in a weekly report, such as presales support, urgent troubleshooting, or cross-department assistance. _Avoid_: Project KR, Lightweight Task

**Lightweight Task**: A temporary collaboration request outside the project structure whose receiver may reply, complete, or dismiss it with a reason. _Avoid_: Objective, KR, work record

**Weekly Report**: A time-boxed account of Planned Project Work and Unplanned Work, including progress, outcomes, evidence, blockers, and next commitments. _Avoid_: Project status, work log

**Risk Signal**: A traceable indication that a Project Baseline may not be met, derived from evidence such as overdue Deliverables, unresolved dependencies, or repeated unfulfilled commitments. _Avoid_: Confirmed issue, AI conclusion

**Intervention**: A human-authorized management action taken in response to a Risk Signal, such as requesting a recommitment, changing scope, or escalating an external dependency. _Avoid_: AI suggestion, notification
