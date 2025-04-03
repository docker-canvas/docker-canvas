import React, { useState, useEffect, useRef, ReactElement, cloneElement } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: ReactElement<any>;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, delay = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x - tooltipRect.width / 2;
      let y = position.y;
      
      // 뷰포트 경계 체크
      if (x < 10) x = 10;
      if (x + tooltipRect.width > viewportWidth - 10) {
        x = viewportWidth - tooltipRect.width - 10;
      }
      
      if (y + tooltipRect.height > viewportHeight - 10) {
        y = position.y - tooltipRect.height - 30; // 상단에 표시
      }
      
      setPosition({ x, y });
    }
  }, [isVisible, position]);
  
  // children의 원래 이벤트 핸들러와 합칠 새 props
  const childProps = {
    ...children.props,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseEnter(e);
      // 원래 onMouseEnter가 있으면 호출
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      handleMouseLeave();
      // 원래 onMouseLeave가 있으면 호출
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
  };
  
  return (
    <>
      {cloneElement(children, childProps)}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-gray-800 text-white p-2 rounded shadow-lg text-sm whitespace-pre-wrap max-w-xs"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;