import { render, screen } from '@testing-library/react';
import FeedbackSummaryCard from '../FeedbackSummaryCard';

describe('FeedbackSummaryCard', () => {
  const mockItem = {
    id: 'f1',
    subject: 'KOR',
    date: '2026-02-01',
    summary: '핵심: 지문 구조 파악',
    body: '세부 피드백 내용...',
  };

  it('renders without crashing', () => {
    render(<FeedbackSummaryCard item={mockItem} />);
    expect(screen.getByText(mockItem.subject)).toBeInTheDocument();
  });

  it('displays the subject', () => {
    render(<FeedbackSummaryCard item={mockItem} />);
    const subject = screen.getByText(mockItem.subject);
    expect(subject).toBeInTheDocument();
    expect(subject).toHaveClass('text-sm', 'font-semibold');
  });

  it('displays the date', () => {
    render(<FeedbackSummaryCard item={mockItem} />);
    const date = screen.getByText(mockItem.date);
    expect(date).toBeInTheDocument();
    expect(date).toHaveClass('text-xs', 'text-neutral-500');
  });

  it('displays the summary', () => {
    render(<FeedbackSummaryCard item={mockItem} />);
    const summary = screen.getByText(mockItem.summary);
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveClass('text-sm');
  });

  it('displays the body', () => {
    render(<FeedbackSummaryCard item={mockItem} />);
    const body = screen.getByText(mockItem.body);
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass('text-xs', 'text-neutral-500', 'line-clamp-2');
  });

  it('applies correct container styling', () => {
    const { container } = render(<FeedbackSummaryCard item={mockItem} />);
    const card = container.firstChild;
    expect(card).toHaveClass('border', 'rounded', 'p-3', 'space-y-1');
  });

  it('renders subject and date in flex container', () => {
    const { container } = render(<FeedbackSummaryCard item={mockItem} />);
    const flexContainer = container.querySelector('.flex.justify-between');
    expect(flexContainer).toBeInTheDocument();
  });

  it('handles different subjects', () => {
    const items = [
      { ...mockItem, subject: 'MATH' },
      { ...mockItem, subject: 'ENG' },
      { ...mockItem, subject: 'SCIENCE' },
    ];

    items.forEach((item) => {
      const { unmount } = render(<FeedbackSummaryCard item={item} />);
      expect(screen.getByText(item.subject)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different date formats', () => {
    const dates = ['2026-02-01', '2026-12-31', '2026-01-01'];

    dates.forEach((date) => {
      const { unmount } = render(<FeedbackSummaryCard item={{ ...mockItem, date }} />);
      expect(screen.getByText(date)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles long summary text', () => {
    const longSummary = 'This is a very long summary that contains a lot of information about the feedback and what the student should focus on';
    render(<FeedbackSummaryCard item={{ ...mockItem, summary: longSummary }} />);
    expect(screen.getByText(longSummary)).toBeInTheDocument();
  });

  it('handles long body text with line-clamp', () => {
    const longBody = 'This is a very long body text that should be clamped to two lines maximum. ' +
      'It contains detailed feedback about the student performance and areas of improvement. ' +
      'The line-clamp-2 class should ensure only two lines are visible.';
    render(<FeedbackSummaryCard item={{ ...mockItem, body: longBody }} />);
    const bodyElement = screen.getByText(longBody);
    expect(bodyElement).toBeInTheDocument();
    expect(bodyElement).toHaveClass('line-clamp-2');
  });

  it('renders with empty strings', () => {
    const emptyItem = {
      id: 'f1',
      subject: '',
      date: '',
      summary: '',
      body: '',
    };
    render(<FeedbackSummaryCard item={emptyItem} />);
    // Component should render without errors even with empty strings
    const { container } = render(<FeedbackSummaryCard item={emptyItem} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('maintains proper hierarchy of text sizes', () => {
    render(<FeedbackSummaryCard item={mockItem} />);

    const subject = screen.getByText(mockItem.subject);
    const date = screen.getByText(mockItem.date);
    const summary = screen.getByText(mockItem.summary);
    const body = screen.getByText(mockItem.body);

    // Subject and summary should be text-sm
    expect(subject).toHaveClass('text-sm');
    expect(summary).toHaveClass('text-sm');

    // Date and body should be text-xs
    expect(date).toHaveClass('text-xs');
    expect(body).toHaveClass('text-xs');
  });

  it('applies font-semibold only to subject', () => {
    render(<FeedbackSummaryCard item={mockItem} />);

    const subject = screen.getByText(mockItem.subject);
    expect(subject).toHaveClass('font-semibold');

    // Other elements should not have font-semibold
    const summary = screen.getByText(mockItem.summary);
    expect(summary).not.toHaveClass('font-semibold');
  });

  it('applies neutral-500 color to date and body', () => {
    render(<FeedbackSummaryCard item={mockItem} />);

    const date = screen.getByText(mockItem.date);
    const body = screen.getByText(mockItem.body);

    expect(date).toHaveClass('text-neutral-500');
    expect(body).toHaveClass('text-neutral-500');
  });

  it('handles special characters in text', () => {
    const specialItem = {
      id: 'f1',
      subject: 'KOR & ENG',
      date: '2026-02-01',
      summary: '핵심: <중요>',
      body: '특수문자 테스트: @#$%^&*()',
    };
    render(<FeedbackSummaryCard item={specialItem} />);

    expect(screen.getByText('KOR & ENG')).toBeInTheDocument();
    expect(screen.getByText('핵심: <중요>')).toBeInTheDocument();
    expect(screen.getByText('특수문자 테스트: @#$%^&*()')).toBeInTheDocument();
  });

  it('renders multiple cards independently', () => {
    const items = [
      { id: 'f1', subject: 'KOR', date: '2026-02-01', summary: 'Summary 1', body: 'Body 1' },
      { id: 'f2', subject: 'ENG', date: '2026-02-02', summary: 'Summary 2', body: 'Body 2' },
    ];

    const { container } = render(
      <>
        <FeedbackSummaryCard item={items[0]} />
        <FeedbackSummaryCard item={items[1]} />
      </>
    );

    expect(screen.getByText('KOR')).toBeInTheDocument();
    expect(screen.getByText('ENG')).toBeInTheDocument();
    expect(screen.getByText('Summary 1')).toBeInTheDocument();
    expect(screen.getByText('Summary 2')).toBeInTheDocument();
  });
});