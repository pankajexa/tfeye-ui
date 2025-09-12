import React from 'react';
import { Select } from './ui/select';

const testOptions = [
  { id: '1', name: 'Option 1' },
  { id: '2', name: 'Option 2' },
  { id: '3', name: 'Option 3' },
  { id: '4', name: 'Option 4' },
  { id: '5', name: 'Option 5' },
  { id: '6', name: 'Option 6' },
  { id: '7', name: 'Option 7' },
  { id: '8', name: 'Option 8' },
  { id: '9', name: 'Option 9' },
  { id: '10', name: 'Option 10' },
];

const RTATestComponent: React.FC = () => {
  const [value, setValue] = React.useState([]);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Select Dropdown Smart Positioning Test</h1>
      
      {/* Test at top of screen */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Top of Screen (should open below)</h2>
        <Select
          options={testOptions}
          value={value}
          onValueChange={setValue}
          placeholder="Select an option..."
          label="Test Select at Top"
        />
      </div>

      {/* Spacer to push next select to middle */}
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-500">Scroll down to test middle positioning</div>
      </div>

      {/* Test in middle of screen */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Middle of Screen (should open below)</h2>
        <Select
          options={testOptions}
          value={value}
          onValueChange={setValue}
          placeholder="Select an option..."
          label="Test Select in Middle"
        />
      </div>

      {/* Spacer to push next select to bottom */}
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-500">Scroll down to test bottom positioning</div>
      </div>

      {/* Test at bottom of screen */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Bottom of Screen (should open above)</h2>
        <Select
          options={testOptions}
          value={value}
          onValueChange={setValue}
          placeholder="Select an option..."
          label="Test Select at Bottom"
        />
      </div>

      {/* Additional spacer to ensure bottom test works */}
      <div className="h-96"></div>
    </div>
  );
};

export default RTATestComponent;