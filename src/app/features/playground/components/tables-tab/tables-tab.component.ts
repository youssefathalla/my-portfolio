import { Component, signal } from '@angular/core';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { ReusableTable } from '@shared/ui/reusable-table/reusable-table.component';
import { TableColumn } from '@shared/ui/reusable-table/table.model';

export interface SampleUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'high' | 'medium' | 'low' | 'critical' | 'normal';
  joinedDate: string;
  budget: number;
}

@Component({
  selector: 'app-tables-tab',
  imports: [SharedIconModule, ReusableTable],
  templateUrl: './tables-tab.component.html',
})
export class TablesTabComponent {
  protected readonly tableUsers = signal<SampleUser[]>([
    {
      id: 'USR-101',
      name: 'Sarah Connor',
      email: 'sarah.c@skynet-defense.org',
      role: 'SecOps Lead',
      status: 'critical',
      joinedDate: '2026-01-15',
      budget: 45000,
    },
    {
      id: 'USR-102',
      name: 'Arthur Dent',
      email: 'arthur@galaxy-guide.space',
      role: 'Content Creator',
      status: 'high',
      joinedDate: '2026-03-22',
      budget: 12000,
    },
    {
      id: 'USR-103',
      name: 'Elena Rostova',
      email: 'elena.r@quantum-cloud.io',
      role: 'Platform Architect',
      status: 'medium',
      joinedDate: '2026-04-10',
      budget: 98000,
    },
    {
      id: 'USR-104',
      name: 'Marcus Vance',
      email: 'm.vance@sol-logistics.net',
      role: 'Fleet Manager',
      status: 'low',
      joinedDate: '2026-05-02',
      budget: 34000,
    },
    {
      id: 'USR-105',
      name: 'Talia Al Ghul',
      email: 'talia@shadow-league.corp',
      role: 'Executive Director',
      status: 'normal',
      joinedDate: '2026-06-18',
      budget: 150000,
    },
  ]);

  protected readonly tableColumns: TableColumn<SampleUser>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'role', label: 'System Role', sortable: true },
    { key: 'status', label: 'Priority / Status' },
    { key: 'joinedDate', label: 'Joined On', sortable: true },
    { key: 'budget', label: 'Budget (USD)', sortable: true },
  ];
}
