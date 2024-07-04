import React from 'react';
interface BiquadFilterNodeProps {
  data: {
    id: string;
    label: string;
    type: "biquadFilter";
    frequency: number;
    Q: number;
    filterType: BiquadFilterType;
  };
}

const BiquadFilterNode :React.FC<BiquadFilterNodeProps> =({ data }) => {
  return (
    <div style={{ padding: 10, background: '#FFC107' }}>
      <strong>{data.label}</strong>
      <div>Type: {data.type}</div>
      <div>Frequency: {data.frequency}</div>
      <div>Q: {data.Q}</div>
      <div>Filter Type: {data.filterType}</div>
    </div>
  );
};

export default BiquadFilterNode;