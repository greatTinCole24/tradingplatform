"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TablePreviewProps {
  data: any[];
}

export default function TablePreview({ data }: TablePreviewProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const keys = Object.keys(data[0]);
  const displayData = data.slice(0, 10); // Show first 10 rows

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {keys.map((key) => (
                  <th
                    key={key}
                    className="text-left p-2 font-semibold text-muted-foreground"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  {keys.map((key) => (
                    <td key={key} className="p-2">
                      {typeof row[key] === "object"
                        ? JSON.stringify(row[key])
                        : String(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-2">
            Showing 10 of {data.length} rows
          </p>
        )}
      </CardContent>
    </Card>
  );
}

