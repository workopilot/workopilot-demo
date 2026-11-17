<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <div class="entry-overview">
    <div class="entry-groups" aria-hidden="true">
      <span>
        <Icon icon="lucide:bot" />
        数字员工下面：对话 + 业务菜单
      </span>
      <span>
        <Icon icon="lucide:blocks" />
        应用里面：应用菜单
      </span>
    </div>
    <div class="entry-cards">
      <article class="entry-card conversation">
        <header>
          <span>01 / 数字员工</span>
          <Icon icon="lucide:messages-square" aria-hidden="true" />
          <h3>
            对话
            <span class="entry-role-label">
              <Icon icon="lucide:users-round" aria-hidden="true" />
              业务人员使用
            </span>
          </h3>
          <strong>用自然语言发起和处理业务</strong>
        </header>
        <div class="entry-card-content">
          <p>
            承载业务问答、需求理解、信息补充、操作预览与确认，以及执行结果和下一步入口。
          </p>
          <div class="entry-example">
            <small>知记 · 汇报助理 / 审阅助理</small>
            <p>
              “根据本周工作生成周报。”
              <br />
              “有哪些月报待我审批？”
            </p>
          </div>
          <div class="entry-result">
            <b>用户看到什么</b>
            <span>补充问题、确认卡片、报告摘要、审批结果与“查看详情”。</span>
          </div>
          <footer>每个数字员工的第一个菜单，默认进入。</footer>
        </div>
      </article>
      <article class="entry-card operations">
        <header>
          <span>02 / 数字员工</span>
          <Icon icon="lucide:panels-top-left" aria-hidden="true" />
          <h3>
            业务菜单
            <span class="entry-role-label">
              <Icon icon="lucide:users-round" aria-hidden="true" />
              业务人员使用
            </span>
          </h3>
          <strong>通过页面持续办理具体业务</strong>
        </header>
        <div class="entry-card-content">
          <p>
            承载业务列表、详情、表单和后续操作。用户可以查询、编辑、提交、审批、跟进，不必每次都从对话开始。
          </p>
          <div class="entry-example">
            <small>知记 · 两个助理各有业务菜单</small>
            <p>
              汇报助理：我的报告、工作记录。
              <br />
              审阅助理：待我审批、已审阅报告。
            </p>
          </div>
          <div class="entry-result">
            <b>用户看到什么</b>
            <span>一份周报的内容与状态、提交按钮、审批意见和历史记录。</span>
          </div>
          <footer>与“对话”同级，按业务对象或结果命名。</footer>
        </div>
      </article>
      <article class="entry-card configuration">
        <header>
          <span>03 / 应用</span>
          <Icon icon="lucide:settings-2" aria-hidden="true" />
          <h3>
            应用菜单
            <span class="entry-role-label">
              <Icon icon="lucide:shield-check" aria-hidden="true" />
              业务管理员使用
            </span>
          </h3>
          <strong>设置这类业务如何运行</strong>
        </header>
        <div class="entry-card-content">
          <p>
            承载共享资源、基础资料、业务规则、模板和权限，由业务管理员维护，并影响相关数字员工的业务操作。
          </p>
          <div class="entry-example">
            <small>知记应用 · 配置菜单</small>
            <p>
              汇报方案：设置周报、月报周期。
              <br />
              报告模板、审批规则与权限设置。
            </p>
          </div>
          <div class="entry-result">
            <b>用户看到什么</b>
            <span>
              哪些人需要汇报、报告包含哪些章节、由谁审批，以及配置的生效范围。
            </span>
          </div>
          <footer>管理业务设置，供多个数字员工共同使用。</footer>
        </div>
      </article>
    </div>
    <div class="entry-state-link">
      <Icon icon="lucide:database" aria-hidden="true" />
      <p>
        <strong>三个入口，同一套业务。</strong>
        对话生成的报告，要能在“我的报告”里看到；页面审批后的状态，要能在对话中查到；应用里的模板与规则，要影响报告生成和审批。
      </p>
    </div>
  </div>
</template>
