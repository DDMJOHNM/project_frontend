import { render, screen } from '@testing-library/react';
import { Client } from './Client';

describe('Client', () => {
  it('renders client name and email', () => {
    const client = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
    };
    render(<Client client={client} />);
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/jane.doe@example.com/)).toBeInTheDocument();
  });

  it('renders optional fields when provided', () => {
    const client = {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
      requested_counsellor: 'Dr. Smith',
      urgency: 'High',
      next_appointment: '2025-03-15',
      initial_consult_notes: 'Some notes here',
    };
    render(<Client client={client} />);
    expect(screen.getByText(/Dr. Smith/)).toBeInTheDocument();
    expect(screen.getByText(/High/)).toBeInTheDocument();
    expect(screen.getByText(/2025-03-15/)).toBeInTheDocument();
    expect(screen.getByText(/Some notes here/)).toBeInTheDocument();
  });

  it('shows em dash for missing optional fields', () => {
    const client = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
    };
    render(<Client client={client} />);
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });
});
