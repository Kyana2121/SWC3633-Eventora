
<?php

return [
    'key' => getenv('EVENT_API_KEY') ?: ($_SERVER['EVENT_API_KEY'] ?? '')
];
