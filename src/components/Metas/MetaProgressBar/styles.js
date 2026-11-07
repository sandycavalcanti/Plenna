import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.metaProgressTrack,
  },
  fill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.metaProgressFill,
  },
});
