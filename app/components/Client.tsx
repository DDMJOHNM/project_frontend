export interface ClientData {
    /** Backend client record id (used for PUT /clients/update/:id notes). */
    client_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    requested_counsellor?: string;
    initial_consult_notes?: string;
    next_appointment?: string;
    urgency?: string;
  }
  
  interface ClientProps {
    client: ClientData;
  }
  
  export function Client({ client }: ClientProps) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-700 flex items-baseline gap-2"><span className="font-semibold">Name:</span>{client.first_name} {client.last_name}</p>
            <p className="text-sm text-gray-700 flex items-baseline gap-2"><span className="font-semibold">Email:</span>{client.email}</p>
            <p className="text-sm text-gray-700 flex items-baseline gap-2"><span className="font-semibold">Requested counsellor:</span>{client.requested_counsellor ?? "—"}</p>
            <p className="text-sm text-gray-700 flex items-baseline gap-2"><span className="font-semibold">Urgency:</span>{client.urgency ?? "—"}</p>
            <p className="text-sm text-gray-700 flex items-baseline gap-2"><span className="font-semibold">Next appointment:</span>{client.next_appointment ?? "—"}</p>
            <div className="text-sm text-gray-700 flex gap-2">
              <span className="font-semibold shrink-0">Initial consult notes:</span>
              <span className="whitespace-pre-wrap">{client.initial_consult_notes ?? "—"}</span>
            </div>
          </div>        
        </div>
      </div>
    );
  }   
  
  