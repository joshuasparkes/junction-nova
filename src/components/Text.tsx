import React from 'react';
import {Text as RNText, TextProps, StyleSheet} from 'react-native';
import {globalTextStyles} from '../styles/commonStyles';

interface CustomTextProps extends TextProps {
  variant?: 'default' | 'bold' | 'semiBold';
}

const CustomText: React.FC<CustomTextProps> = ({
  variant = 'default',
  style,
  ...props
}) => {
  const textStyle = [
    variant === 'bold'
      ? globalTextStyles.bold
      : variant === 'semiBold'
      ? globalTextStyles.semiBold
      : globalTextStyles.default,
    style,
  ];

  return <RNText style={textStyle} {...props} />;
};

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Figtree-Regular', // Default font
  },
});

export default CustomText;
