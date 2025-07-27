
import { Trash2 } from "lucide-react";

const EmptyTrash = () => (
  <div className="text-center py-24">
    <div className="max-w-md mx-auto">
      <Trash2 className="h-20 w-20 text-gray-300 mx-auto mb-6" />
      <h3 className="text-2xl font-semibold text-gray-600 mb-3">
        No notes in trash
      </h3>
      <p className="text-gray-500 text-lg">
        Deleted notes will appear here. You can restore or delete them permanently.
      </p>
    </div>
  </div>
);

export default EmptyTrash;
