import GitHubIcon from '@mui/icons-material/GitHub'
import { Typography, useTheme } from '@mui/material'

import { Link } from './link'

export function Footer({ githubEditPath }: { githubEditPath: string }) {
    const theme = useTheme()

    return (
        <Link
            external
            to={
                'https://github.com/fathyb/fathy.fr/blob/main/' + githubEditPath
            }
            sx={{
                display: 'inline-flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                color: theme.palette.text.secondary,
            }}
        >
            <GitHubIcon
                fontSize="small"
                sx={{
                    color: theme.palette.text.secondary,
                    marginRight: theme.spacing(1),
                }}
            />
            <Typography variant="body1">Edit this page</Typography>
        </Link>
    )
}
