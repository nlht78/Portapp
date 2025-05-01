import { ICustomer } from '~/interfaces/customer.interface';
import CustomerList from './CustomerList';

export default function CustomerSelectPopup({
  isOpen,
  onClose,
  onSelect,
  customers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  customers: ICustomer[];
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onSelect(customer);
    onClose();
  };

  return (
    <div>
      <CustomerList />
    </div>
  );
}
