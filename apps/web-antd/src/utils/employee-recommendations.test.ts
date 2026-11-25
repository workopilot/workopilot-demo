import { describe, expect, it, vi } from 'vitest';

import { mockWorkOrders } from '../api/mock-data-ticket';
import { managedProjects } from '../api/mock-project-management';
import {
  availableRecommendations,
  recommendationDraft,
  recommendationEmployee,
} from './employee-recommendations';
import { projectRecommendations } from './project-recommendations';
import { ticketRecommendations } from './ticket-recommendations';

vi.mock('#/api/mock-data-mate', () => import('../api/mock-data-mate'));
vi.mock('#/api/mock-data-ticket', () => import('../api/mock-data-ticket'));

function at<T>(items: T[], index = 0): T {
  const item = items[index];
  if (!item) throw new Error('Missing test fixture');
  return item;
}

describe('cross-employee recommendations', () => {
  it('excludes the current employee, unregistered targets and empty actions', () => {
    const employee = recommendationEmployee('meeting-assistant', '需要协调', [
      { id: 'meeting', title: '预约周会', prompt: '准备周会草稿' },
    ]);
    expect(availableRecommendations([employee], 'meeting-assistant')).toEqual(
      [],
    );
    expect(
      availableRecommendations(
        [
          employee,
          { ...employee, id: 'unknown' },
          { ...employee, actions: [] },
          {
            ...employee,
            path: '/app/mate/employee/ticket-assistant/ticket-chat',
          },
        ],
        'pmo-assistant',
      ),
    ).toEqual([employee]);
  });

  it('adapts meetings and task creation to project state without mutating the project', () => {
    const project = structuredClone(at(managedProjects));
    project.progress = 40;
    project.health = 'healthy';
    const before = JSON.stringify(project);
    const normal = projectRecommendations(
      project,
      'pmo-assistant',
      '2026-01-01',
    );
    expect(at(at(normal.employees).actions).title).toContain('周会');
    expect(JSON.stringify(project)).toBe(before);
    project.health = 'blocked';
    expect(
      at(at(projectRecommendations(project, 'pmo-assistant').employees).actions)
        .title,
    ).toContain('协调会');
    project.progress = 100;
    const completed = projectRecommendations(project, 'pmo-assistant');
    expect(at(at(completed.employees).actions).title).toContain('复盘');
    expect(
      at(completed.employees, 1).actions.some(
        (action) => action.id === 'create-task',
      ),
    ).toBe(false);
  });

  it('carries only the selected project into the draft and finds overdue unaccepted work', () => {
    const project = structuredClone(at(managedProjects));
    const tasks = project.stages.flatMap((stage) =>
      stage.objectives.flatMap((objective) => objective.krs),
    );
    tasks.forEach((task) => {
      task.status = 'accepted';
    });
    at(tasks).status = 'in-progress';
    at(tasks).dueDate = '2026-01-01';
    const result = projectRecommendations(
      project,
      'pmo-assistant',
      '2026-11-25',
    );
    expect(result.context.summary).toContain('任务：1 项');
    expect(result.context.summary).toContain(at(tasks).id);
    const draft = recommendationDraft(
      result.context,
      at(at(result.employees).actions),
    );
    expect(draft).toContain(project.id);
    expect(draft).toContain(project.name);
    expect(draft).toContain(project.manager);
    expect(draft).toContain('当前需求：');
    at(tasks).dueDate = '12/01';
    expect(
      projectRecommendations(project, 'pmo-assistant', '2026-11-25').context
        .summary,
    ).toContain('任务：0 项');
    at(tasks).dueDate = '02/30';
    expect(
      projectRecommendations(project, 'pmo-assistant', '2026-11-25').context
        .summary,
    ).toContain('任务：0 项');
  });

  it('offers an onsite application only while processing and changes meeting advice for acceptance', () => {
    const order = { ...at(mockWorkOrders), status: 'processing' as const };
    expect(
      ticketRecommendations(order).employees.some(
        (employee) => employee.id === 'fill-assistant',
      ),
    ).toBe(true);
    expect(
      ticketRecommendations(order).employees.find(
        (employee) => employee.id === 'fill-assistant',
      )?.path,
    ).toBe('/app/mate/employee/fill-assistant/ticket-chat');
    const acceptance = ticketRecommendations({
      ...order,
      status: 'pending-acceptance',
    });
    expect(acceptance.employees.map((employee) => employee.id)).toEqual([
      'meeting-assistant',
    ]);
    expect(at(at(acceptance.employees).actions).title).toContain('验收沟通');
    expect(acceptance.context.query.ticketCode).toBe(order.code);
  });
});
