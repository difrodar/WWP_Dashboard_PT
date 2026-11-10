import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEY } from './utils/demoStorage';

const kpi = (label: string) => document.querySelector(`[data-kpi="${label}"] [data-kpi-value]`)?.textContent;
const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const rowNames = () => bodyRows().map((r) => within(r).getAllByRole('button')[0].textContent);
const queueTab = () => screen.getByRole('tab', { name: /Active Flagged Queue/ });

async function openEvent(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }));
  return screen.getByRole('dialog', { name });
}

describe('Community Fundraising Monitor', () => {
  it('shows the disclaimer, as-of date, KPIs, and the active flagged queue by default', () => {
    render(<App />);
    expect(screen.getByText(/Academic Prototype — Synthetic Data Only\./)).toBeInTheDocument();
    expect(screen.getByText(/Not connected to WWP, Salesforce, or DonorDrive systems/)).toBeInTheDocument();
    expect(screen.getByLabelText('As-of date')).toHaveValue('2026-11-10');
    expect(kpi('Total Flagged $0 Events')).toBe('10');
    expect(kpi('High-Priority Events')).toBe('4');
    expect(kpi('Events Awaiting Processing')).toBe('2');
    expect(kpi('Average Days Since Event')).toBe('53.1');
    expect(queueTab()).toHaveAttribute('aria-selected', 'true');
    expect(bodyRows()).toHaveLength(10);
    // 29- and 30-day events are not in the queue; 31-day event is.
    expect(screen.queryByRole('button', { name: 'Coastal Valor 5K' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pinecrest Veterans Golf Scramble' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lakeside 24-Hour Gaming Marathon' })).toBeInTheDocument();
  });

  it('renders all ten required columns', () => {
    render(<App />);
    for (const col of ['Event Name', 'Host Name', 'Event Date', 'Event Type', 'Amount Raised', 'Days Since Event', 'Review Status', 'Priority', 'Assigned Specialist', 'Next Action']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(col) })).toBeInTheDocument();
    }
  });

  it('filters, updates KPIs, shows an empty state, and clears filters', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Priority'), 'High');
    expect(bodyRows()).toHaveLength(4);
    expect(kpi('Total Flagged $0 Events')).toBe('4');
    expect(screen.getByRole('button', { name: /Remove filter Priority: High/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Event type'), 'Bake Sale');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No events match these filters')).toBeInTheDocument();
    expect(kpi('Average Days Since Event')).toBe('—');

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(bodyRows()).toHaveLength(10);
  });

  it('sorts by column header and announces the sort order', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nameHeader = screen.getByRole('columnheader', { name: /Event Name/ });
    await user.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    const asc = rowNames();
    expect(asc).toEqual([...asc].sort((a, b) => a!.localeCompare(b!)));
    await user.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(rowNames()).toEqual([...asc].reverse());

    const daysHeader = screen.getByRole('columnheader', { name: /Days Since Event/ });
    await user.click(within(daysHeader).getByRole('button'));
    expect(daysHeader).toHaveAttribute('aria-sort', 'descending');
    expect(rowNames()[0]).toBe('Granite Peak Hike-a-Thon');
    expect(screen.getByText('Days since event', { selector: 'strong' })).toBeInTheDocument();
  });

  it('opens and closes the event detail drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openEvent(user, 'Riverbend Community Pancake Breakfast');
    expect(within(dialog).getByText('Gordon Pruitt')).toBeInTheDocument();
    expect(within(dialog).getByText('Offline check in transit', { selector: 'dd' })).toBeInTheDocument();
    expect(within(dialog).getByRole('list', { name: 'Event activity timeline' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const again = await openEvent(user, 'Riverbend Community Pancake Breakfast');
    await user.click(within(again).getByRole('button', { name: 'Close event details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('changes status, assigns a specialist, and sets a next-action date', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openEvent(user, 'Copper Canyon Charity Poker Night');
    await user.selectOptions(within(dialog).getByLabelText('Review status'), 'Host Contact Needed');
    await user.selectOptions(within(dialog).getByLabelText('Assigned specialist'), 'Elena Kowalski');
    fireEvent.change(within(dialog).getByLabelText('Next action date'), { target: { value: '2026-11-17' } });
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Case updated and recorded in the timeline.')).toBeInTheDocument();
    const timeline = within(dialog).getByRole('list', { name: 'Event activity timeline' });
    expect(within(timeline).getByText('Review status changed to Host Contact Needed.')).toBeInTheDocument();
    expect(within(timeline).getByText('Assigned to Elena Kowalski.')).toBeInTheDocument();
    expect(within(timeline).getByText('Next action scheduled for Nov 17, 2026.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    const row = screen.getByRole('button', { name: 'Copper Canyon Charity Poker Night' }).closest('tr')!;
    expect(within(row).getByText('Host Contact Needed')).toBeInTheDocument();
    expect(within(row).getByText('Elena Kowalski')).toBeInTheDocument();
    expect(within(row).getByText('Nov 17, 2026')).toBeInTheDocument();
  });

  it('adds a follow-up note', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openEvent(user, 'Lakeside 24-Hour Gaming Marathon');
    await user.type(within(dialog).getByLabelText('New follow-up note'), 'Checked page totals; no gifts yet.');
    await user.click(within(dialog).getByRole('button', { name: 'Add note' }));
    expect(within(dialog).getByText('Checked page totals; no gifts yet.')).toBeInTheDocument();
    expect(within(dialog).getByText('Follow-up note added.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('New follow-up note')).toHaveValue('');
  });

  it('awaiting processing keeps the event in the queue; resolving removes it and updates KPIs', async () => {
    const user = userEvent.setup();
    render(<App />);
    let dialog = await openEvent(user, 'Lakeside 24-Hour Gaming Marathon');
    await user.click(within(dialog).getByRole('button', { name: 'Mark Awaiting Processing' }));
    expect(kpi('Events Awaiting Processing')).toBe('3');
    expect(kpi('Total Flagged $0 Events')).toBe('10');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Lakeside 24-Hour Gaming Marathon' })).toBeInTheDocument();

    dialog = await openEvent(user, 'Lakeside 24-Hour Gaming Marathon');
    await user.click(within(dialog).getByRole('button', { name: 'Mark Resolved' }));
    expect(kpi('Total Flagged $0 Events')).toBe('9');
    expect(kpi('Events Awaiting Processing')).toBe('2');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Lakeside 24-Hour Gaming Marathon' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /All Events/ }));
    const row = screen.getByRole('button', { name: 'Lakeside 24-Hour Gaming Marathon' }).closest('tr')!;
    expect(within(row).getByText('Not Flagged — Resolved')).toBeInTheDocument();
  });

  it('shows data-quality exceptions separately', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /Data-Quality Exceptions/ }));
    expect(rowNames()).toEqual(['Heroes Hoops 3-on-3 Tournament']);
    expect(screen.getByText('Data-Quality Review')).toBeInTheDocument();
  });

  it('recalculates when the as-of date changes', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('As-of date'), { target: { value: '2026-11-11' } });
    expect(kpi('Total Flagged $0 Events')).toBe('11');
    expect(screen.getByRole('button', { name: 'Pinecrest Veterans Golf Scramble' })).toBeInTheDocument();
    // 70 days earlier: only the closed 120-day event is old enough, so the queue is empty.
    fireEvent.change(screen.getByLabelText('As-of date'), { target: { value: '2026-09-01' } });
    expect(kpi('Total Flagged $0 Events')).toBe('0');
    expect(kpi('Average Days Since Event')).toBe('—');
    expect(screen.getByText('No events currently need review')).toBeInTheDocument();
  });

  it('persists demo edits across a reload and resets them after confirmation', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    const dialog = await openEvent(user, 'Lakeside 24-Hour Gaming Marathon');
    await user.click(within(dialog).getByRole('button', { name: 'Mark Resolved' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Resolved or Funds Attributed');
    first.unmount();

    render(<App />); // simulates a page refresh
    expect(kpi('Total Flagged $0 Events')).toBe('9');

    await user.click(screen.getByRole('button', { name: 'Reset Demo Data' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Reset demo data?' });
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect(kpi('Total Flagged $0 Events')).toBe('9');

    await user.click(screen.getByRole('button', { name: 'Reset Demo Data' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reset demo data' }));
    expect(kpi('Total Flagged $0 Events')).toBe('10');
    expect(screen.getByRole('button', { name: 'Lakeside 24-Hour Gaming Marathon' })).toBeInTheDocument();
  });
});
