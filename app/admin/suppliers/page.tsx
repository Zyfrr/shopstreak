"use client"

export default function AdminSuppliers() {
  const suppliers = [
    { id: 1, name: "TechHub Supplies", products: 45, syncStatus: "active", payoutPending: "₹125,400" },
    { id: 2, name: "Electronics Direct", products: 32, syncStatus: "active", payoutPending: "₹89,300" },
    { id: 3, name: "Global Imports", products: 28, syncStatus: "inactive", payoutPending: "₹0" },
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <h1 className="text-3xl font-bold">Suppliers</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-3 text-left font-semibold">Products</th>
                  <th className="px-6 py-3 text-left font-semibold">Sync Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Payout Pending</th>
                  <th className="px-6 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border hover:bg-muted transition">
                    <td className="px-6 py-3 font-semibold">{supplier.name}</td>
                    <td className="px-6 py-3">{supplier.products}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          supplier.syncStatus === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {supplier.syncStatus === "active" ? "Syncing" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold">{supplier.payoutPending}</td>
                    <td className="px-6 py-3">
                      <button className="px-3 py-1 bg-accent text-accent-foreground rounded text-xs font-semibold hover:opacity-90">
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
