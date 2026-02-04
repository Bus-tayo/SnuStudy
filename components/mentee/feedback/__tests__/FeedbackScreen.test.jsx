import { render, screen } from '@testing-library/react';
import FeedbackScreen from '../FeedbackScreen';
import { mockFeedbacks } from '@/lib/mock/mockData';

// Mock the mockData module
jest.mock('@/lib/mock/mockData', () => ({
  mockFeedbacks: jest.fn(),
}));

// Mock the FeedbackSummaryCard component
jest.mock('../FeedbackSummaryCard', () => {
  return function MockFeedbackSummaryCard({ item }) {
    return (
      <div data-testid={`feedback-card-${item.id}`}>
        <span data-testid="subject">{item.subject}</span>
        <span data-testid="date">{item.date}</span>
        <span data-testid="summary">{item.summary}</span>
      </div>
    );
  };
});

describe('FeedbackScreen', () => {
  const mockFeedbackData = [
    { id: 'f1', subject: 'KOR', date: '2026-02-01', summary: '핵심: 지문 구조 파악', body: '세부 피드백 내용...' },
    { id: 'f2', subject: 'ENG', date: '2026-02-01', summary: '핵심: 구문/동사', body: '세부 피드백 내용...' },
    { id: 'f3', subject: 'MATH', date: '2026-02-01', summary: '핵심: 오답원인 분류', body: '세부 피드백 내용...' },
  ];

  beforeEach(() => {
    mockFeedbacks.mockReturnValue(mockFeedbackData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FeedbackScreen />);
    expect(screen.getByText('과목별 피드백')).toBeInTheDocument();
  });

  it('displays the correct heading', () => {
    render(<FeedbackScreen />);
    const heading = screen.getByText('과목별 피드백');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-lg', 'font-bold');
  });

  it('calls mockFeedbacks function', () => {
    render(<FeedbackScreen />);
    expect(mockFeedbacks).toHaveBeenCalledTimes(1);
  });

  it('renders all feedback items', () => {
    render(<FeedbackScreen />);
    mockFeedbackData.forEach((feedback) => {
      expect(screen.getByTestId(`feedback-card-${feedback.id}`)).toBeInTheDocument();
    });
  });

  it('renders feedback items with correct data', () => {
    render(<FeedbackScreen />);

    expect(screen.getByText('KOR')).toBeInTheDocument();
    expect(screen.getByText('ENG')).toBeInTheDocument();
    expect(screen.getByText('MATH')).toBeInTheDocument();

    expect(screen.getByText('핵심: 지문 구조 파악')).toBeInTheDocument();
    expect(screen.getByText('핵심: 구문/동사')).toBeInTheDocument();
    expect(screen.getByText('핵심: 오답원인 분류')).toBeInTheDocument();
  });

  it('renders correct number of feedback cards', () => {
    render(<FeedbackScreen />);
    const cards = screen.getAllByTestId(/feedback-card-/);
    expect(cards).toHaveLength(3);
  });

  it('passes correct item prop to each FeedbackSummaryCard', () => {
    render(<FeedbackScreen />);

    mockFeedbackData.forEach((feedback) => {
      const card = screen.getByTestId(`feedback-card-${feedback.id}`);
      expect(card).toBeInTheDocument();
    });
  });

  it('renders with empty feedback list', () => {
    mockFeedbacks.mockReturnValue([]);
    render(<FeedbackScreen />);

    expect(screen.getByText('과목별 피드백')).toBeInTheDocument();
    expect(screen.queryByTestId(/feedback-card-/)).not.toBeInTheDocument();
  });

  it('handles single feedback item', () => {
    mockFeedbacks.mockReturnValue([mockFeedbackData[0]]);
    render(<FeedbackScreen />);

    expect(screen.getByTestId('feedback-card-f1')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card-f2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card-f3')).not.toBeInTheDocument();
  });

  it('applies correct container styling', () => {
    const { container } = render(<FeedbackScreen />);
    const mainDiv = container.firstChild;

    expect(mainDiv).toHaveClass('p-4', 'space-y-3');
  });

  it('maintains correct key prop for list rendering', () => {
    render(<FeedbackScreen />);

    // Verify each item has a unique key by checking all items are rendered
    const cards = screen.getAllByTestId(/feedback-card-/);
    expect(cards).toHaveLength(mockFeedbackData.length);
  });

  it('handles feedback items with different subjects', () => {
    const customData = [
      { id: 'f1', subject: 'SCIENCE', date: '2026-02-01', summary: 'Test 1', body: 'Body 1' },
      { id: 'f2', subject: 'HISTORY', date: '2026-02-01', summary: 'Test 2', body: 'Body 2' },
    ];
    mockFeedbacks.mockReturnValue(customData);

    render(<FeedbackScreen />);

    expect(screen.getByText('SCIENCE')).toBeInTheDocument();
    expect(screen.getByText('HISTORY')).toBeInTheDocument();
  });

  it('handles feedback items with long summaries', () => {
    const longSummary = 'This is a very long summary that contains a lot of information about the feedback';
    const customData = [
      { id: 'f1', subject: 'KOR', date: '2026-02-01', summary: longSummary, body: 'Body' },
    ];
    mockFeedbacks.mockReturnValue(customData);

    render(<FeedbackScreen />);

    expect(screen.getByText(longSummary)).toBeInTheDocument();
  });
});