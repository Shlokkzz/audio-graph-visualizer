import React from 'react';

    export interface GainNodeProps {
      data: {
        type: "gain";
    audioNode: GainNode;
    gain: number;
    label: string;
      };
    }
export const GainNode2 :React.FC<GainNodeProps>= ({ data }) => {
  return (
    <div style={{ padding: 10, background: '#8BC34A' }}>
      <strong>{data.label}</strong>
      <div>Type: {data.type}</div>
      <div>Gain: {data.gain}</div>
    </div>
  );
};

